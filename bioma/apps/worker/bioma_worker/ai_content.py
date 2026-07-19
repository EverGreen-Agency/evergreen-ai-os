import json
from typing import Any

import httpx


OUTPUT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["strategy_note", "posts"],
    "properties": {
        "strategy_note": {"type": "string"},
        "posts": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["title", "channel", "format", "hook", "caption", "cta"],
                "properties": {
                    "title": {"type": "string"},
                    "channel": {
                        "type": "string",
                        "enum": ["instagram", "linkedin", "facebook", "tiktok", "youtube"],
                    },
                    "format": {"type": "string"},
                    "hook": {"type": "string"},
                    "caption": {"type": "string"},
                    "cta": {"type": "string"},
                },
            },
        },
    },
}


def generate_content(request: dict[str, Any], settings, http_client: httpx.Client | None = None) -> dict[str, Any]:
    if not settings.openai_api_key:
        return {
            "provider": "local_preview",
            "model": "methodology-preview-v1",
            "generation_mode": "preview",
            "output": _preview_output(request),
        }

    payload = {
        "model": settings.openai_model,
        "instructions": (
            "Você é o estúdio de conteúdo da EverGreen. Gere rascunhos em português do Brasil, "
            "específicos para o briefing, sem inventar números, depoimentos ou promessas. "
            "Respeite os canais, a quantidade e as referências metodológicas fornecidas."
        ),
        "input": json.dumps(
            {
                "brief": request["brief"],
                "channels": request["channels"],
                "quantity": request["quantity"],
                "tone": request.get("tone"),
                "objective": request.get("objective"),
                "methodology_refs": request.get("methodology_refs", []),
            },
            ensure_ascii=False,
        ),
        "text": {
            "format": {
                "type": "json_schema",
                "name": "bioma_social_content",
                "strict": True,
                "schema": OUTPUT_SCHEMA,
            }
        },
        "max_output_tokens": 5000,
    }
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
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
    if len(output.get("posts", [])) != request["quantity"]:
        raise RuntimeError("O provedor retornou uma quantidade de posts diferente da solicitada.")
    return {
        "provider": "openai",
        "model": response_data.get("model") or settings.openai_model,
        "generation_mode": "live",
        "output": output,
        "response_id": response_data.get("id"),
        "usage": response_data.get("usage") or {},
    }


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


def _preview_output(request: dict[str, Any]) -> dict[str, Any]:
    channels = request["channels"]
    objective = request.get("objective") or "iniciar uma conversa relevante"
    tone = request.get("tone") or "claro, humano e confiante"
    posts = []
    for index in range(request["quantity"]):
        channel = channels[index % len(channels)]
        posts.append(
            {
                "title": f"Rascunho {index + 1}: {objective[:60]}",
                "channel": channel,
                "format": "post estático" if channel != "tiktok" else "roteiro curto",
                "hook": f"E se o próximo passo para {objective.lower()} fosse mais simples?",
                "caption": (
                    f"Ponto de partida editorial em tom {tone}.\n\n"
                    f"Briefing: {request['brief'][:500]}\n\n"
                    "Revise fatos, exemplos e voz da marca antes de publicar."
                ),
                "cta": "Converse com a equipe e transforme este rascunho em uma peça final.",
            }
        )
    return {
        "strategy_note": "Prévia metodológica local. Configure OPENAI_API_KEY no worker para geração real.",
        "posts": posts,
    }
