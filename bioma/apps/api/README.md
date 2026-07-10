# Bioma API

Backend HTTP do Bioma MVP v0.

Responsabilidades iniciais:

- auth e sessão;
- escopo por cliente;
- audit log;
- ClickUp Bridge;
- publicação de artefatos para o Client Hub;
- healthcheck para staging e produção.

## Banco local

Com o Docker do Bioma rodando:

```bash
python scripts/migrate.py
python scripts/seed_dev.py
```

Usuários de desenvolvimento:

- `eduardo@evergreengrowth.com.br` / `senha-dev-123`
- `henrique@hmconexoes.com.br` / `senha-dev-123`

## Rodar local

```bash
python -m venv .venv
pip install -r requirements.txt
uvicorn bioma_api.main:app --reload
```

## Validar

```bash
python -m compileall bioma_api scripts
python scripts/smoke_api.py
python scripts/smoke_clickup.py
```

O smoke test valida health, CORS local, login, listagem, bloqueio de sync para cliente, BOLA/IDOR básico, criação/edição de cliente, artefato, entrega e sync ClickUp dry-run.

`smoke_clickup.py` valida o cliente ClickUp com `httpx.MockTransport`, sem chamar a API real.

## ClickUp real

Configure `CLICKUP_API_TOKEN` no `.env` da API para ativar leitura real. O sync usa `clickup_folder_id` do cliente ou IDs cadastrados em `clickup_mappings`, lê tasks por lista e faz upsert local em `deliverables` por `clickup_task_id`.

O MVP não escreve no ClickUp. Qualquer escrita externa permanece HITL.
