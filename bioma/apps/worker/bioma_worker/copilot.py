"""Motor do copiloto do Bioma — interpreta intenção e propõe ações.

Decisões travadas com o Eduardo (2026-07-30):
1. Ação reversível executa direto (com desfazer); ação visível ao cliente
   SEMPRE pede confirmação.
2. Busca na web é permitida, mas **toda** resposta cita fonte — inclusive
   quando o dado vem do Bioma (aí a fonte é a tabela/tela de origem).
3. Escopo: só EG.

O motor NÃO executa nada: ele devolve um plano (`actions`) que a API valida
contra permissão e reversibilidade antes de aplicar. Isso mantém o poder de
decisão no backend, não no texto que o modelo gerou.
"""

import json
from typing import Any

import httpx

# Catálogo fechado. O modelo só pode escolher daqui — nome inventado é rejeitado
# pela API. `reversible=False` força confirmação humana, independentemente do
# que o modelo sugerir.
ACTION_CATALOG: dict[str, dict[str, Any]] = {
    "create_subtasks": {
        "label": "Quebrar em subtarefas",
        "reversible": True,
        "params": ["titles"],
        "description": "Cria subtarefas (checklist) na tarefa atual.",
    },
    "set_due_date": {
        "label": "Alterar prazo",
        "reversible": True,
        "params": ["due_date"],
        "description": "Define a data de vencimento da tarefa atual (ISO 8601).",
    },
    "set_status": {
        "label": "Alterar status",
        "reversible": True,
        "params": ["status"],
        "description": "Muda o status da tarefa dentro do vocabulário da frente.",
    },
    "add_comment": {
        "label": "Comentar na tarefa",
        "reversible": True,
        "params": ["body"],
        "description": "Publica um comentário interno na tarefa atual.",
    },
    "summarize_thread": {
        "label": "Resumir conversa",
        "reversible": True,
        "params": [],
        "description": "Só responde no chat, não altera nada.",
    },
    "request_client_approval": {
        "label": "Pedir aprovação do cliente",
        "reversible": False,
        "params": ["deliverable_id"],
        "description": "VISÍVEL AO CLIENTE: cria pedido de aprovação.",
    },
    "send_whatsapp": {
        "label": "Enviar WhatsApp",
        "reversible": False,
        "params": ["to_number", "message"],
        "description": "VISÍVEL AO CLIENTE: envia mensagem real.",
    },
    "answer_only": {
        "label": "Apenas responder",
        "reversible": True,
        "params": [],
        "description": "Nenhuma alteração — a pergunta é respondida com fontes.",
    },
    "remember_fact": {
        "label": "Guardar na memória",
        "reversible": True,
        "params": ["category", "title", "body"],
        "description": (
            "Guarda um fato/preferência/diretiva reutilizável nas próximas conversas. "
            "category: fact|preference|directive. Fica marcado como escrito pelo agente."
        ),
    },
    "propose_skill": {
        "label": "Propor procedimento novo (skill)",
        "reversible": True,
        "params": ["name", "description", "procedure"],
        "description": (
            "Propõe um procedimento reutilizável descoberto na conversa. NÃO fica ativo "
            "sozinho — só passa a ser seguido depois que um admin EG aprovar."
        ),
    },
}

PLAN_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["answer", "actions", "sources", "confidence", "skills_used"],
    "properties": {
        "answer": {"type": "string"},
        "skills_used": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Nomes exatos das skills de dossier.approved_skills que orientaram esta resposta.",
        },
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["name", "params", "why"],
                "properties": {
                    "name": {"type": "string", "enum": sorted(ACTION_CATALOG)},
                    "params": {"type": "string"},
                    "why": {"type": "string"},
                },
            },
        },
        "sources": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["kind", "reference"],
                "properties": {
                    "kind": {"type": "string", "enum": ["bioma", "web"]},
                    "reference": {"type": "string"},
                },
            },
        },
        "confidence": {"type": "string", "enum": ["alta", "media", "baixa"]},
    },
}

INSTRUCTIONS = """
Você é o copiloto do Bioma, o sistema operacional da agência EverGreen. Fala com
alguém do time EG (nunca com o cliente final).

Recebe: a mensagem do usuário, o contexto da tela onde ele está e um dossiê de
dados reais do Bioma. Devolve uma resposta curta e, quando cabível, um plano de
ações escolhidas SÓ do catálogo recebido.

Regras obrigatórias:
- **Toda** afirmação factual precisa de entrada em `sources`. Dado do Bioma usa
  `kind: "bioma"` e `reference` no formato "tela ou tabela: campo" (ex.:
  "tarefas: 12 atrasadas no workspace"). Informação de web usa `kind: "web"` com
  a URL. Sem fonte, não afirme: diga que não sabe.
- `params` é uma STRING com JSON válido dos parâmetros da ação.
- Não proponha ação que o usuário não pediu nem sugeriu. Em dúvida, use
  `answer_only` e pergunte.
- Ações marcadas como visíveis ao cliente serão confirmadas por um humano antes
  de executar — proponha, nunca prometa que já fez.
- `confidence: "baixa"` quando o dossiê não cobre a pergunta.
- Português do Brasil, direto, sem preâmbulo.

Sobre memória (dossier.memories) e procedimentos (dossier.approved_skills):
- releia a memória e as skills aprovadas ANTES de responder — elas existem pra
  você não perguntar de novo o que já foi dito, nem redescobrir um procedimento
  já resolvido antes;
- ao citar algo da memória como fonte, use `reference` no formato
  "memória: <título>";
- quando você descobrir, nesta conversa, um fato reutilizável sobre o cliente
  ou a operação (não uma trivialidade de uma vez só), proponha `remember_fact`;
- quando resolver algo que exigiu vários passos não óbvios e que provavelmente
  vai se repetir, proponha `propose_skill` — ela só passa a valer depois que um
  humano aprovar, então proponha sem medo de errar o tom.
""".strip()


MULTISTEP_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["summary", "steps", "open_questions"],
    "properties": {
        "summary": {"type": "string"},
        "steps": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["action", "label", "params", "why"],
                "properties": {
                    "action": {"type": "string", "enum": sorted(ACTION_CATALOG)},
                    "label": {"type": "string"},
                    "params": {"type": "string"},
                    "why": {"type": "string"},
                },
            },
        },
        # O que o plano NÃO consegue responder sozinho. É o que substitui o
        # formulário: em vez de exigir preenchimento antes, o copiloto monta o
        # que dá e devolve as perguntas que faltam.
        "open_questions": {"type": "array", "items": {"type": "string"}},
    },
}

PLANNER_INSTRUCTIONS = """
Você é o planejador do copiloto do Bioma. Recebe um objetivo do time EG e monta
uma SEQUÊNCIA de ações do catálogo que atinge esse objetivo.

Regras obrigatórias:
- use SOMENTE ações do catálogo recebido; nada fora dele;
- cada `params` é uma STRING com JSON válido dos parâmetros daquela ação;
- ordene as etapas por dependência real (o que precisa existir antes);
- máximo de 10 etapas — se o objetivo for maior, cubra a primeira fase e diga o
  resto em `open_questions`;
- NÃO invente dado do cliente. Se falta informação para uma etapa, não chute:
  coloque a pergunta em `open_questions` e deixe a etapa de fora;
- `label` é o que um humano lê para aprovar: descreva o efeito, não a mecânica
  ("Criar as 5 subtarefas da campanha", não "chamar create_subtasks");
- prefira poucas etapas certas a muitas etapas plausíveis.
""".strip()


def plan_multistep(
    request: dict[str, Any],
    settings,
    http_client: httpx.Client | None = None,
) -> dict[str, Any]:
    """Monta um plano de N etapas. Não executa nada — quem executa é a API,
    depois da aprovação humana."""
    if not settings.openai_api_key:
        return {
            "output": {
                "summary": (
                    "Prévia local: nenhum plano foi gerado (OPENAI_API_KEY não configurada). "
                    "O objetivo foi registrado, mas as etapas exigem interpretação de IA."
                ),
                "steps": [],
                "open_questions": ["Configure OPENAI_API_KEY para o copiloto montar o plano."],
            },
            "generation_mode": "preview",
        }

    payload = {
        "model": settings.openai_model,
        "instructions": PLANNER_INSTRUCTIONS,
        "input": json.dumps(
            {
                "goal": request.get("goal"),
                "context": request.get("context") or {},
                "dossier": request.get("dossier") or {},
                "available_actions": {
                    name: {
                        "description": spec["description"],
                        "params": spec["params"],
                        "requires_human_confirmation": not spec["reversible"],
                    }
                    for name, spec in ACTION_CATALOG.items()
                    if name in (request.get("allowed_actions") or list(ACTION_CATALOG))
                },
            },
            ensure_ascii=False,
            default=str,
        ),
        "text": {
            "format": {
                "type": "json_schema",
                "name": "bioma_copilot_multistep",
                "strict": True,
                "schema": MULTISTEP_SCHEMA,
            }
        },
        "max_output_tokens": 2500,
        "store": False,
    }
    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
    owns_client = http_client is None
    client = http_client or httpx.Client(
        base_url="https://api.openai.com",
        timeout=settings.openai_request_timeout_seconds,
    )
    try:
        response = client.post("/v1/responses", headers=headers, json=payload)
        response.raise_for_status()
        response_data = response.json()
    finally:
        if owns_client:
            client.close()

    return {"output": json.loads(_output_text(response_data)), "generation_mode": "live"}


def plan(request: dict[str, Any], settings, http_client: httpx.Client | None = None) -> dict[str, Any]:
    if not settings.openai_api_key:
        return {
            "output": _preview_plan(request),
            "generation_mode": "preview",
            "provider": "local_preview",
            "model": "copilot-preview-v1",
        }

    tools: list[dict[str, Any]] = []
    if request.get("allow_web_search"):
        tools.append(
            {
                "type": "web_search",
                "search_context_size": "low",
                "user_location": {"type": "approximate", "country": "BR", "timezone": "America/Sao_Paulo"},
            }
        )

    payload: dict[str, Any] = {
        "model": settings.openai_model,
        "instructions": INSTRUCTIONS,
        "input": json.dumps(
            {
                "message": request.get("message"),
                "surface": request.get("surface"),
                "context": request.get("context") or {},
                "dossier": request.get("dossier") or {},
                "available_actions": {
                    name: {
                        "description": spec["description"],
                        "params": spec["params"],
                        "requires_human_confirmation": not spec["reversible"],
                    }
                    for name, spec in ACTION_CATALOG.items()
                    if name in (request.get("allowed_actions") or list(ACTION_CATALOG))
                },
            },
            ensure_ascii=False,
            default=str,
        ),
        "text": {
            "format": {
                "type": "json_schema",
                "name": "bioma_copilot_plan",
                "strict": True,
                "schema": PLAN_SCHEMA,
            }
        },
        "max_output_tokens": 1500,
        "store": False,
    }
    if tools:
        payload["tools"] = tools
        payload["include"] = ["web_search_call.action.sources"]

    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
    owns_client = http_client is None
    client = http_client or httpx.Client(
        base_url="https://api.openai.com",
        timeout=settings.openai_request_timeout_seconds,
    )
    try:
        response = client.post("/v1/responses", headers=headers, json=payload)
        response.raise_for_status()
        response_data = response.json()
    finally:
        if owns_client:
            client.close()

    output = json.loads(_output_text(response_data))
    # URLs realmente visitadas pela ferramenta de busca; o que o modelo declarou
    # sem a ferramenta ter visitado não entra como fonte web.
    visited = _visited_urls(response_data)
    output["sources"] = [
        source
        for source in output.get("sources", [])
        if source.get("kind") == "bioma" or source.get("reference") in visited
    ]
    return {
        "output": output,
        "generation_mode": "live",
        "provider": "openai",
        "model": settings.openai_model,
    }


def _visited_urls(response_data: dict[str, Any]) -> set[str]:
    urls: set[str] = set()
    for item in response_data.get("output", []):
        if item.get("type") == "web_search_call":
            for source in (item.get("action") or {}).get("sources", []):
                if source.get("url"):
                    urls.add(source["url"])
        if item.get("type") == "message":
            for content in item.get("content", []):
                for annotation in content.get("annotations", []):
                    citation = annotation.get("url_citation") or annotation
                    if citation.get("url"):
                        urls.add(citation["url"])
    return urls


def _output_text(response_data: dict[str, Any]) -> str:
    if isinstance(response_data.get("output_text"), str):
        return response_data["output_text"]
    for item in response_data.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                return content["text"]
    raise RuntimeError("A resposta do provedor não contém output_text.")


def _preview_plan(request: dict[str, Any]) -> dict[str, Any]:
    """Sem chave de IA o copiloto não adivinha intenção: devolve o dossiê que
    montaria e diz o que falta. Nenhuma ação é proposta."""
    dossier = request.get("dossier") or {}
    populated = [key for key, value in dossier.items() if value]
    return {
        "answer": (
            "Prévia local: nenhuma interpretação de IA foi executada "
            "(OPENAI_API_KEY não configurada). O contexto que eu usaria está listado nas fontes."
        ),
        "actions": [],
        "sources": [{"kind": "bioma", "reference": f"dossiê: {key}"} for key in populated],
        "confidence": "baixa",
        "skills_used": [],
    }
