# Bioma Worker

Worker assíncrono e agendável do Bioma. O primeiro uso real é a sincronização do módulo de Performance, portado do BIAds.

## Responsabilidades

- Consumir solicitações `queued` de `sync_runs` com lock transacional no Postgres.
- Sincronizar Google Ads, GA4, Search Console e Google Tag Manager.
- Fazer upsert idempotente nas tabelas diárias por cliente.
- Isolar falhas por provider e concluir a execução como `ok`, `partial` ou `error`.
- Atualizar a saúde das conexões sem armazenar credenciais em texto puro no banco.

O MVP usa o próprio Postgres como fila durável. Redis/RQ só deve entrar se volume, concorrência ou retry distribuído justificarem uma fila dedicada.

## Configuração

Copie `../../infra/env/worker.example.env` para `.env` e configure:

- `DATABASE_URL`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, quando a conta for acessada por MCC
- `GOOGLE_ADS_API_VERSION`, atualmente `v21` por padrão e configurável sem alterar código

No banco, `performance_connections.credentials_ref` deve apontar para `env:GOOGLE_SERVICE_ACCOUNT_JSON` ou, futuramente, para uma referência de cofre. O JSON da service account não deve ser salvo em `performance_connections`.

## Execução

```bash
python -m venv .venv
pip install -r requirements.txt
python -m bioma_worker.cli
```

Processar toda a fila:

```bash
python -m bioma_worker.cli --drain
```

Enfileirar todos os clientes ativos com janela incremental de três dias e processar:

```bash
python -m bioma_worker.cli --enqueue-all --drain --days 3
```

Esse último comando é o candidato para uma job isolada no Fly Cron Manager. Ele evita duplicar uma execução que já esteja `queued` ou `running` para o mesmo cliente.

## Testes

```bash
python scripts/smoke_worker.py
python scripts/smoke_queue.py
```

`smoke_worker.py` valida normalização e auditoria sem rede. `smoke_queue.py` valida a fila e o encerramento auditável de falha sem usar uma conta Google real.
