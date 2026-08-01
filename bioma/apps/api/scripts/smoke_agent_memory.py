"""Smoke da memória persistente dos agentes, contra o Postgres real.

Valida:
- só EG (client_user recebe 403);
- memória global x memória de workspace não vazam entre si;
- toda escrita gera revisão (versionamento — "o que melhorou");
- skill proposta nasce pending_review e NÃO aparece no dossiê do copiloto até
  ser aprovada;
- o copiloto executa remember_fact/propose_skill de ponta a ponta (via plano
  determinístico injetado, testando a autoridade da API, não o modelo).
"""

from pathlib import Path
import atexit
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import json

from fastapi.testclient import TestClient

from bioma_api.db import connect
from bioma_api.main import app
from bioma_api.services import copilot as copilot_service
from smoke_support import cleanup_smoke_data, create_smoke_workspace, grant_client_user, upsert_smoke_user

ADMIN_EMAIL = "eduardo@evergreengrowth.com.br"
CLIENT_EMAIL = "smoke-memory-client@bioma.example.com"
PASSWORD = "senha-dev-123"


def assert_status(response, expected: int, label: str) -> None:
    if response.status_code != expected:
        raise AssertionError(f"{label}: esperado {expected}, recebido {response.status_code}: {response.text}")


def fake_plan(actions, skills_used=None, answer="ok"):
    def _plan(_request):
        return {
            "output": {
                "answer": answer,
                "actions": actions,
                "sources": [],
                "confidence": "alta",
                "skills_used": skills_used or [],
            },
            "generation_mode": "live",
            "provider": "fake",
            "model": "fake",
        }

    return _plan


def main() -> None:
    workspace = create_smoke_workspace("MEMORY")
    client_user_id = upsert_smoke_user(CLIENT_EMAIL, "Memory Client Smoke", PASSWORD)
    grant_client_user(workspace, client_user_id)

    # Limpeza garantida mesmo se a falha acontecer antes do try/finally:
    # sem isto, uma assercao quebrada deixa o workspace na carteira.
    atexit.register(lambda: cleanup_smoke_data([workspace.organization_id], [CLIENT_EMAIL]))
    admin = TestClient(app)
    client_user = TestClient(app)
    assert_status(admin.post("/auth/login", json={"email": ADMIN_EMAIL, "password": PASSWORD}), 200, "login admin")
    assert_status(client_user.post("/auth/login", json={"email": CLIENT_EMAIL, "password": PASSWORD}), 200, "login cliente")

    assert_status(client_user.get("/agent-memory/memories"), 403, "cliente nao acessa memoria")
    print("escopo EG-only: 403 para client_user OK")

    memory_ids: list[str] = []
    skill_ids: list[str] = []
    try:
        # 1) Memória global (identidade do copiloto) — humana, workspace_id=None.
        global_memory = admin.post(
            "/agent-memory/memories",
            json={
                "category": "identity",
                "title": "Smoke: tom de voz do copiloto",
                "body": "Direto, sem emoji, cita fonte sempre.",
                "reason": "seed do smoke",
            },
        )
        assert_status(global_memory, 201, "criar memoria global")
        global_id = global_memory.json()["id"]
        memory_ids.append(global_id)
        assert global_memory.json()["workspace_id"] is None, global_memory.json()
        assert global_memory.json()["authored_by"] is not None, "memoria criada por humano deve ter authored_by"

        # 2) Memória de workspace.
        workspace_memory = admin.post(
            "/agent-memory/memories",
            json={
                "workspace_id": str(workspace.workspace_id),
                "category": "fact",
                "title": "Smoke: cliente prefere reuniao as sextas",
                "body": "Observado em 3 reunioes seguidas.",
                "reason": "seed do smoke",
            },
        )
        assert_status(workspace_memory, 201, "criar memoria de workspace")
        workspace_memory_id = workspace_memory.json()["id"]
        memory_ids.append(workspace_memory_id)

        # 3) Listagem do workspace inclui global + workspace; listagem só-global não vaza a de workspace.
        listing = admin.get(f"/agent-memory/memories?workspace_id={workspace.workspace_id}&include_global=true")
        assert_status(listing, 200, "listar memorias do workspace")
        titles = {row["title"] for row in listing.json()}
        assert "Smoke: tom de voz do copiloto" in titles and "Smoke: cliente prefere reuniao as sextas" in titles, titles

        global_only = admin.get("/agent-memory/memories?include_global=true")
        assert_status(global_only, 200, "listar memoria global")
        global_titles = {row["title"] for row in global_only.json()}
        assert "Smoke: cliente prefere reuniao as sextas" not in global_titles, "memoria de workspace vazou pro escopo global"
        print("escopo global x workspace: sem vazamento OK")

        # 4) Toda escrita gera revisão.
        updated = admin.patch(
            f"/agent-memory/memories/{workspace_memory_id}",
            json={"body": "Confirmado em 5 reunioes seguidas — padrao consistente.", "reason": "mais evidencia acumulada"},
        )
        assert_status(updated, 200, "atualizar memoria")
        revisions = admin.get(f"/agent-memory/memories/{workspace_memory_id}/revisions")
        assert_status(revisions, 200, "listar revisoes")
        actions_seen = [row["action"] for row in revisions.json()]
        assert actions_seen == ["updated", "created"], actions_seen
        print(f"versionamento OK — {len(actions_seen)} revisao(oes): {actions_seen}")

        archived = admin.patch(
            f"/agent-memory/memories/{workspace_memory_id}/status",
            json={"status": "archived", "reason": "smoke encerrando"},
        )
        assert_status(archived, 200, "arquivar memoria")
        active_listing = admin.get(f"/agent-memory/memories?workspace_id={workspace.workspace_id}")
        assert workspace_memory_id not in {row["id"] for row in active_listing.json()}, "memoria arquivada nao deveria aparecer em active"
        print("arquivar remove da listagem ativa OK")

        # 5) Skill proposta nasce pending_review e não entra no dossiê do copiloto.
        original_plan = copilot_service.copilot_plan_safe
        try:
            copilot_service.copilot_plan_safe = fake_plan(
                [
                    {
                        "name": "propose_skill",
                        "params": json.dumps(
                            {
                                "name": "smoke-reagendar-sexta",
                                "description": "Como reagendar reuniao deste cliente",
                                "procedure": "Sempre oferecer sexta de manha primeiro.",
                            }
                        ),
                        "why": "padrao observado",
                    }
                ]
            )
            response = admin.post(
                "/copilot",
                json={"message": "aprendi algo novo", "surface": "workspace", "workspace_id": str(workspace.workspace_id)},
            )
            assert_status(response, 200, "propor skill via copiloto")
            body = response.json()
            action = body["actions"][0]
            assert action["status"] == "executed", action
            assert "aguardando aprovação" in action["detail"].lower(), action
            print("propose_skill via copiloto: criada como pending_review OK")

            pending = admin.get(f"/agent-memory/skills?workspace_id={workspace.workspace_id}&status=pending_review")
            assert_status(pending, 200, "listar skills pendentes")
            proposed = next(row for row in pending.json() if row["name"] == "smoke-reagendar-sexta")
            skill_ids.append(proposed["id"])
            assert proposed["proposed_by"] is None, "skill proposta pelo agente nao deveria ter proposed_by humano"

            # Skill pendente NÃO deve aparecer no dossiê do copiloto ainda.
            copilot_service.copilot_plan_safe = fake_plan([], answer="dossie de teste")
            captured = {}
            real_dossier_builder = copilot_service._build_dossier

            def spy_dossier(payload, user):
                dossier, context, task_row = real_dossier_builder(payload, user)
                captured["dossier"] = dossier
                return dossier, context, task_row

            copilot_service._build_dossier = spy_dossier
            admin.post(
                "/copilot",
                json={"message": "oi", "surface": "workspace", "workspace_id": str(workspace.workspace_id)},
            )
            copilot_service._build_dossier = real_dossier_builder
            skill_names_in_dossier = {row["name"] for row in captured["dossier"]["approved_skills"]}
            assert "smoke-reagendar-sexta" not in skill_names_in_dossier, "skill pendente vazou pro dossie do copiloto"
            print("skill pendente ausente do dossie do copiloto OK")

            # 6) Aprovar — agora entra no dossiê.
            approved = admin.post(f"/agent-memory/skills/{proposed['id']}/review", json={"status": "approved"})
            assert_status(approved, 200, "aprovar skill")
            assert approved.json()["reviewed_by"] is not None, approved.json()

            captured.clear()
            copilot_service._build_dossier = spy_dossier
            admin.post(
                "/copilot",
                json={"message": "oi de novo", "surface": "workspace", "workspace_id": str(workspace.workspace_id)},
            )
            copilot_service._build_dossier = real_dossier_builder
            skill_names_in_dossier = {row["name"] for row in captured["dossier"]["approved_skills"]}
            assert "smoke-reagendar-sexta" in skill_names_in_dossier, "skill aprovada nao apareceu no dossie"
            print("skill aprovada aparece no dossie do copiloto OK")

            # Revisar skill já revisada: 409 (revisão é de uma via só).
            assert_status(
                admin.post(f"/agent-memory/skills/{proposed['id']}/review", json={"status": "approved"}),
                409,
                "revisar skill ja revisada",
            )
            print("revisar skill duas vezes: 409 OK")

            # 7) remember_fact via copiloto.
            copilot_service.copilot_plan_safe = fake_plan(
                [
                    {
                        "name": "remember_fact",
                        "params": json.dumps(
                            {"category": "preference", "title": "Smoke: prefere reuniao curta", "body": "Máx 20min."}
                        ),
                        "why": "observado na call",
                    }
                ]
            )
            response = admin.post(
                "/copilot",
                json={"message": "guarda isso", "surface": "workspace", "workspace_id": str(workspace.workspace_id)},
            )
            assert_status(response, 200, "remember_fact via copiloto")
            action = response.json()["actions"][0]
            assert action["status"] == "executed" and action["undo_hint"], action
            new_memory = next(
                row
                for row in admin.get(f"/agent-memory/memories?workspace_id={workspace.workspace_id}").json()
                if row["title"] == "Smoke: prefere reuniao curta"
            )
            memory_ids.append(new_memory["id"])
            assert new_memory["authored_by"] is None, "memoria escrita pelo copiloto deveria ter authored_by nulo"
            print("remember_fact via copiloto: memoria criada e marcada como escrita pelo agente OK")
        finally:
            copilot_service.copilot_plan_safe = original_plan
            copilot_service._build_dossier = real_dossier_builder

        # 8) Retirar skill aprovada.
        retired = admin.post(f"/agent-memory/skills/{proposed['id']}/retire")
        assert_status(retired, 200, "retire skill aprovada")
        assert retired.json()["status"] == "retired", retired.json()
        print("retire skill OK")
    finally:
        with connect() as conn:
            for skill_id in skill_ids:
                conn.execute("delete from agent_skills where id = %s", (skill_id,))
            for memory_id in memory_ids:
                conn.execute("delete from agent_memories where id = %s", (memory_id,))
        cleanup_smoke_data([workspace.organization_id], [CLIENT_EMAIL])
    print("limpeza OK — smoke_agent_memory passou")


if __name__ == "__main__":
    main()
