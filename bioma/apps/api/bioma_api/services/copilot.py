"""Copiloto do Bioma — interpreta, propõe e executa o que for reversível.

Contrato de segurança (decisões do Eduardo em 2026-07-30):
- ação **reversível** executa direto e o retorno diz como desfazer;
- ação **visível ao cliente** nunca executa aqui: volta como `pending_confirmation`;
- toda resposta carrega fontes; dado do Bioma cita a origem, web cita a URL;
- **só EG**: `require_platform_admin` em toda entrada.

O plano vem do modelo, mas a autoridade é daqui: nome fora do catálogo, parâmetro
inválido ou ação irreversível são recusados independentemente do que o texto diga.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timezone

from fastapi import HTTPException, status

from bioma_api.access import is_platform_admin, require_platform_admin
from bioma_api.db import connect
from bioma_api.repositories import agent_memory as memory_repo
from bioma_api.repositories import client_hub as client_hub_repo
from bioma_api.repositories import tasks as tasks_repo
from bioma_api.repositories import workspaces as workspaces_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.copilot import (
    CopilotAction,
    CopilotRequest,
    CopilotResponse,
    CopilotSource,
)
from bioma_api.worker_bridge import copilot_action_catalog, copilot_plan_safe

# Por superfície, o que o copiloto pode propor. Uma superfície não enxerga ação
# que não faz sentido nela — reduz o espaço de erro do modelo.
SURFACE_ACTIONS = {
    "task": [
        "create_subtasks", "set_due_date", "set_status", "add_comment",
        "summarize_thread", "answer_only", "remember_fact", "propose_skill",
    ],
    "workspace": ["answer_only", "summarize_thread", "remember_fact", "propose_skill"],
}


def run(payload: CopilotRequest, user: CurrentUserResponse) -> CopilotResponse:
    require_platform_admin(user)

    catalog = copilot_action_catalog()
    allowed = SURFACE_ACTIONS.get(payload.surface, ["answer_only"])

    dossier, context, task_row = _build_dossier(payload, user)

    try:
        result = copilot_plan_safe(
            {
                "message": payload.message,
                "surface": payload.surface,
                "context": context,
                "dossier": dossier,
                "allowed_actions": allowed,
                "allow_web_search": payload.allow_web_search,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="O copiloto não conseguiu responder agora. Tente novamente.",
        ) from exc

    output = result["output"]
    actions: list[CopilotAction] = []

    for proposed in output.get("actions", []):
        name = proposed.get("name")
        spec = catalog.get(name)
        if not spec or name not in allowed:
            # Nome inventado ou fora da superfície: descartado sem executar.
            continue
        try:
            params = json.loads(proposed.get("params") or "{}")
        except json.JSONDecodeError:
            params = {}
        if not isinstance(params, dict):
            params = {}

        if not spec["reversible"]:
            actions.append(
                CopilotAction(
                    name=name,
                    label=spec["label"],
                    params=params,
                    why=proposed.get("why", ""),
                    status="pending_confirmation",
                    detail="Ação visível ao cliente — precisa da sua confirmação.",
                )
            )
            continue

        if payload.dry_run:
            actions.append(
                CopilotAction(
                    name=name,
                    label=spec["label"],
                    params=params,
                    why=proposed.get("why", ""),
                    status="proposed",
                    detail="Pré-visualização: nada foi alterado.",
                )
            )
            continue

        actions.append(_execute(name, spec, params, proposed.get("why", ""), task_row, user, payload.workspace_id))

    skill_ids_by_name: dict[str, str] = context.get("skill_ids_by_name") or {}
    used_skill_ids = [skill_ids_by_name[name] for name in output.get("skills_used", []) if name in skill_ids_by_name]
    if used_skill_ids:
        with connect() as conn:
            for skill_id in used_skill_ids:
                memory_repo.record_skill_use(conn, skill_id)

    sources = [
        CopilotSource(kind=source.get("kind", "bioma"), reference=source.get("reference", ""))
        for source in output.get("sources", [])
        if source.get("reference")
    ]

    return CopilotResponse(
        answer=output.get("answer", ""),
        generation_mode=result["generation_mode"],
        confidence=output.get("confidence", "baixa"),
        actions=actions,
        sources=sources,
    )


def _build_dossier(payload: CopilotRequest, user: CurrentUserResponse) -> tuple[dict, dict, dict | None]:
    """Só dado real, e só do escopo que o usuário pode ver."""
    dossier: dict = {}
    context: dict = {"surface": payload.surface}
    task_row = None

    with connect() as conn:
        if payload.task_id:
            task_row = tasks_repo.get_task(conn, payload.task_id)
            if not task_row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada.")
            comments = tasks_repo.list_task_comments(conn, payload.task_id, True)
            dossier["task"] = {
                "title": task_row["title"],
                "status": task_row["status"],
                "group_status": task_row["group_status"],
                "priority": task_row.get("priority"),
                "start_date": task_row.get("start_date"),
                "due_date": task_row.get("due_date"),
                "description": (task_row.get("description") or "")[:2000],
            }
            dossier["task_comments"] = [
                {"author": row.get("author_name"), "body": row["body"][:600]} for row in comments[-10:]
            ]
            context["task_id"] = str(payload.task_id)

        if payload.workspace_id:
            client = workspaces_repo.find_accessible_client(
                conn, payload.workspace_id, is_platform_admin(user), user.id
            )
            if not client:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace não encontrado.")
            context["workspace_id"] = str(client["workspace_id"])
            context["client_name"] = client["name"]

        # "O que priorizar hoje" precisa das tarefas da pessoa, não da carteira toda.
        my_tasks = tasks_repo.list_my_tasks(conn, user.id, is_platform_admin(user))
        dossier["my_tasks"] = [
            {
                "title": row["title"],
                "status": row["status"],
                "due_date": row.get("due_date"),
                "workspace": row.get("workspace_name"),
                "overdue": bool(row.get("due_date") and _is_overdue(row["due_date"])),
            }
            for row in my_tasks[:40]
        ]
        summary = client_hub_repo.get_portfolio_summary(conn)
        dossier["portfolio"] = {
            "overdue_deliverables": summary["overdue_deliverables"],
            "clients_at_risk": summary["clients_at_risk"],
            "pending_approvals": len(summary["pending_approvals"]),
            "stale_connections": len(summary["stale_connections"]),
            "radar_prospects_awaiting": summary["radar_prospects_awaiting"],
        }

        # Memória persistente (global da EG + do workspace, quando há um em
        # contexto) e skills já aprovadas — é o que faz o copiloto não perguntar
        # de novo o que já foi dito, e não redescobrir procedimento já resolvido.
        workspace_uuid = payload.workspace_id
        memories = memory_repo.list_memories(conn, workspace_uuid, include_global=True)
        dossier["memories"] = [
            {
                "scope": "global" if row["workspace_id"] is None else "workspace",
                "category": row["category"],
                "title": row["title"],
                "body": row["body"],
                "authored_by_agent": row["authored_by"] is None,
            }
            for row in memories
        ]
        skills = memory_repo.list_skills(conn, workspace_uuid, include_global=True, status="approved")
        dossier["approved_skills"] = [
            {"name": row["name"], "description": row["description"], "procedure": row["procedure"]}
            for row in skills
        ]
        context["skill_ids_by_name"] = {row["name"]: str(row["id"]) for row in skills}
    return dossier, context, task_row


def _is_overdue(value) -> bool:
    if isinstance(value, datetime):
        reference = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return reference < datetime.now(timezone.utc)
    if isinstance(value, date):
        return value < date.today()
    return False


def _execute(
    name: str,
    spec: dict,
    params: dict,
    why: str,
    task_row: dict | None,
    user: CurrentUserResponse,
    workspace_id=None,
) -> CopilotAction:
    """Executa ação reversível e devolve como desfazer."""

    def done(detail: str, undo: str | None = None) -> CopilotAction:
        return CopilotAction(
            name=name, label=spec["label"], params=params, why=why,
            status="executed", detail=detail, undo_hint=undo,
        )

    def failed(detail: str) -> CopilotAction:
        return CopilotAction(
            name=name, label=spec["label"], params=params, why=why,
            status="failed", detail=detail,
        )

    if name in ("summarize_thread", "answer_only"):
        return done("Nada foi alterado.")

    if name == "remember_fact":
        category = params.get("category")
        title = (params.get("title") or "").strip()
        body = (params.get("body") or "").strip()
        if category not in ("fact", "preference", "directive") or not title or not body:
            return failed("Categoria, título e conteúdo são obrigatórios para guardar na memória.")
        with connect() as conn:
            memory_repo.create_memory(
                conn, workspace_id, category, title[:200], body[:4000], None, "Escrito pelo copiloto durante a conversa."
            )
        scope = "deste workspace" if workspace_id else "global da EG"
        return done(f'Memória "{title}" guardada ({scope}).', "Arquive a memória na tela de memórias para desfazer.")

    if name == "propose_skill":
        skill_name = (params.get("name") or "").strip()
        description = (params.get("description") or "").strip()
        procedure = (params.get("procedure") or "").strip()
        if not skill_name or not description or not procedure:
            return failed("Nome, descrição e procedimento são obrigatórios para propor uma skill.")
        with connect() as conn:
            memory_repo.create_skill(
                conn, workspace_id, skill_name[:120], description[:300], procedure[:6000], None, why[:2000] or None
            )
        return done(
            f'Skill "{skill_name}" proposta — aguardando aprovação de um admin EG.',
            "Rejeite a skill na fila de revisão para descartar.",
        )

    if not task_row:
        return failed("Esta ação exige uma tarefa em contexto.")

    task_id = task_row["id"]

    if name == "create_subtasks":
        titles = [str(title).strip() for title in (params.get("titles") or []) if str(title).strip()]
        if not titles:
            return failed("Nenhum título de subtarefa foi proposto.")
        with connect() as conn:
            for title in titles[:20]:
                tasks_repo.add_subtask(conn, task_id, title[:300])
        return done(
            f"{len(titles[:20])} subtarefa(s) criada(s).",
            "Remova pelo checklist da tarefa para desfazer.",
        )

    if name == "set_due_date":
        raw = params.get("due_date")
        if not raw:
            return failed("Data de vencimento não informada.")
        previous = task_row.get("due_date")
        with connect() as conn:
            tasks_repo.update_task(conn, task_id, {"due_date": raw})
        return done(
            f"Prazo alterado para {raw}.",
            f"Prazo anterior: {previous or 'sem prazo'}.",
        )

    if name == "set_status":
        new_status = params.get("status")
        if not new_status:
            return failed("Status não informado.")
        previous = task_row["status"]
        with connect() as conn:
            tasks_repo.update_task(conn, task_id, {"status": new_status})
        return done(f"Status alterado para {new_status}.", f"Status anterior: {previous}.")

    if name == "add_comment":
        body = (params.get("body") or "").strip()
        if not body:
            return failed("Comentário vazio.")
        with connect() as conn:
            # Comentário do copiloto nasce interno e assinado: quem lê a thread
            # precisa saber que aquilo não foi digitado por uma pessoa.
            tasks_repo.create_task_comment(
                conn,
                task_id,
                user.id,
                f"{body}\n\n_(via copiloto)_",
                False,
            )
        return done("Comentário publicado (interno).", "Exclua o comentário na tarefa para desfazer.")

    return failed("Ação sem execução implementada.")


def catalog_for(surface: str) -> list[dict]:
    """Catálogo da superfície — alimenta o menu de `/` na interface."""
    catalog = copilot_action_catalog()
    allowed = SURFACE_ACTIONS.get(surface, ["answer_only"])
    return [
        {
            "name": name,
            "label": catalog[name]["label"],
            "description": catalog[name]["description"],
            "requires_confirmation": not catalog[name]["reversible"],
        }
        for name in allowed
        if name in catalog
    ]
