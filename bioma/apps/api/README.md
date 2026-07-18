# Bioma API

Backend HTTP do Bioma MVP v0.

Responsabilidades iniciais:

- auth e sessão;
- escopo por cliente;
- descoberta persistente de workspaces por tenant;
- CRM/funil de leads;
- financeiro mínimo;
- métricas manuais/analytics honesto;
- audit log;
- ClickUp Bridge;
- publicação de artefatos para o Client Hub;
- healthcheck para staging e produção.

Deploy do MVP: Railway, com root directory `bioma/apps/api` e `railway.json`.

## Banco local

Com o Docker do Bioma rodando:

```bash
python scripts/migrate.py
python scripts/seed_dev.py
python scripts/create_eg_client.py
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

O smoke test valida health, CORS local, login, listagem, bloqueio de sync para cliente, BOLA/IDOR básico, criação/edição de cliente, artefato, entrega, lead, financeiro, métrica manual e sync ClickUp dry-run.

Também valida `GET /workspaces`: o EG admin recebe o workspace interno e os clientes; `client_user` recebe somente seu próprio contexto. O smoke cobre ainda membership legada indevida na organização EG, bloqueio de convite ao workspace interno e revogação de Client Hub, Files, Performance e Kommo quando um workspace cliente é arquivado. `create_eg_client.py` mantém temporariamente o adapter exigido pelos módulos da Operação EG, mas esse registro não aparece como workspace cliente.

`smoke_clickup.py` valida o cliente ClickUp com `httpx.MockTransport`, sem chamar a API real.

## ClickUp real

Configure `CLICKUP_API_TOKEN` no `.env` da API para ativar leitura real. O sync usa `clickup_folder_id` do cliente ou IDs cadastrados em `clickup_mappings`, lê tasks por lista e faz upsert local em `deliverables` por `clickup_task_id`.

O MVP não escreve no ClickUp. Qualquer escrita externa permanece HITL.

## Endpoints HM/MVP

- `GET/POST/PATCH/DELETE /clients/{client_id}/leads`
- `GET/POST/PATCH/DELETE /clients/{client_id}/finance`
- `GET/POST/PATCH/DELETE /clients/{client_id}/metrics`

Esses endpoints cobrem o mínimo da proposta HM: funil de leads, controle financeiro e analytics manual enquanto integrações de mídia não estão conectadas.
