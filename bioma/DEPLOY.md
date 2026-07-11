# Deploy do Bioma

Este runbook descreve staging e produção do Bioma sem depender de uma sessão ou LLM específica.

## Decisão atual

- Web: Vercel.
- API, Postgres e jobs: Railway no staging.
- Primeira produção: Railway se a EG aceitar formalmente transferência internacional e a região disponível.
- Alternativa de produção: Fly.io em `gru` quando residência ou latência no Brasil for requisito.
- Redis não é necessário no deploy atual. A fila de Performance usa `sync_runs` no Postgres.

O objetivo é lançar rápido sem prender a arquitetura. API e worker usam Docker, Postgres padrão e variáveis de ambiente, portanto a migração Railway → Fly continua viável.

## Topologia

```text
Navegador
  └─ Vercel: bioma-web
       └─ HTTPS público → Railway: bioma-api
                            ├─ rede privada → Postgres
                            ├─ cron drain (5 min) → fila sync_runs
                            └─ cron sync (6 h) → Google Ads/GA4/GSC/GTM
```

Somente a API recebe domínio público no Railway. Postgres e jobs permanecem privados.

## Domínios e sessão

Preferir web e API sob o mesmo domínio registrável:

| Ambiente | Web | API |
|---|---|---|
| Staging | `staging.bioma.<dominio-eg>` | `api-staging.bioma.<dominio-eg>` |
| Produção | `bioma.<dominio-eg>` | `api.bioma.<dominio-eg>` |

Com esses domínios:

```text
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=lax
SESSION_COOKIE_DOMAIN=
```

O cookie permanece host-only na API e é enviado porque web/API são same-site. Usar temporariamente `vercel.app` + `railway.app` exige `SESSION_COOKIE_SAMESITE=none` e pode sofrer bloqueio de cookie de terceiros. Não é a configuração recomendada para produção.

## Estratégia de branches

- `develop`: deploy automático de staging.
- `main`: produção, somente por PR aprovado de `develop`.
- Branch de feature: Vercel Preview; não conectar automaticamente a banco de produção.

O `main` precisa receber o histórico atual por PR antes do primeiro deploy de produção.

## 1. Gate local

Na raiz do repo:

```powershell
git status --short --branch
cd bioma\apps\api
python scripts\migrate.py
python scripts\seed_dev.py
python scripts\smoke_api.py
python scripts\smoke_clickup.py
python scripts\smoke_performance.py

cd ..\worker
python scripts\smoke_worker.py
python scripts\smoke_queue.py

cd ..\web
npm.cmd ci
npm.cmd run build
```

O CI em `.github/workflows/bioma-ci.yml` repete esses checks em todo PR que altera `bioma/**`.

## 2. Railway staging

Crie um projeto `bioma` e um ambiente persistente `staging`.

### 2.1 Postgres

1. Adicione PostgreSQL pelo catálogo Railway.
2. Nomeie o serviço `postgres-staging`.
3. Ative backup diário.
4. Não exponha a conexão pública para API/worker; use a variável privada do projeto.

### 2.2 API

1. Adicione o repo GitHub `EverGreen-Agency/evergreen-ai-os`.
2. Branch: `develop`.
3. Root Directory: `bioma/apps/api`.
4. Config as Code: `/bioma/apps/api/railway.json`.
5. Gere domínio público para a API.
6. Configure:

```text
APP_ENV=staging
API_NAME=Bioma API - Staging
DATABASE_URL=${{postgres-staging.DATABASE_URL}}
CORS_ORIGINS=https://staging.bioma.<dominio-eg>
SESSION_COOKIE_NAME=bioma_staging_session
SESSION_TTL_HOURS=12
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=lax
SESSION_COOKIE_DOMAIN=
CLICKUP_API_TOKEN=<secret do ambiente>
CLICKUP_API_BASE_URL=https://api.clickup.com/api/v2
CLICKUP_TASK_PAGE_LIMIT=3
```

O config executa migration antes do deploy, inicia Uvicorn em `$PORT` e usa `/health/ready` como readiness check.

### 2.3 Admin inicial

Não execute `seed_dev.py` em produção. Para staging controlado, use o seed apenas com `ALLOW_DEV_SEED=true` durante a preparação e remova a variável depois.

Para bootstrap sem massa demo:

```text
BOOTSTRAP_ADMIN_EMAIL=<email EG>
BOOTSTRAP_ADMIN_PASSWORD=<senha aleatória com 16+ caracteres>
BOOTSTRAP_ADMIN_DISPLAY_NAME=<nome>
```

Execute uma única vez no shell da API:

```bash
python scripts/bootstrap_admin.py
```

Uma nova execução não troca a senha por padrão. Para rotação explícita, defina `BOOTSTRAP_ROTATE_PASSWORD=true` apenas durante o comando.

### 2.4 Jobs

Crie dois serviços a partir de `bioma/apps/worker`:

| Serviço | Config as Code | Função |
|---|---|---|
| `worker-drain-staging` | `/bioma/apps/worker/railway.drain.json` | Processa fila manual a cada 5 min |
| `worker-sync-staging` | `/bioma/apps/worker/railway.sync.json` | Enfileira e processa janela incremental a cada 6 h |

Variáveis compartilhadas:

```text
DATABASE_URL=${{postgres-staging.DATABASE_URL}}
GOOGLE_SERVICE_ACCOUNT_JSON=<JSON compacto secreto>
GOOGLE_ADS_DEVELOPER_TOKEN=<secret>
GOOGLE_ADS_LOGIN_CUSTOMER_ID=<MCC quando aplicável>
GOOGLE_ADS_API_VERSION=v21
GOOGLE_REQUEST_TIMEOUT_SECONDS=60
```

Os jobs devem terminar após a execução. Não configure restart contínuo.

## 3. Vercel staging

1. Importe o mesmo repo GitHub.
2. Crie o projeto `bioma-staging`.
3. Root Directory: `bioma/apps/web`.
4. Framework: Vite.
5. Build: `npm run build`.
6. Output: `dist`.
7. Production Branch desse projeto: `develop`.
8. Configure:

```text
VITE_APP_ENV=staging
VITE_API_BASE_URL=https://api-staging.bioma.<dominio-eg>
```

9. Aplique domínio fixo de staging e proteção aos previews.
10. Atualize `CORS_ORIGINS` da API com a URL final exata e redeploy.

## 4. Smoke remoto

Execute fora da Railway:

```powershell
$env:BIOMA_API_BASE_URL='https://api-staging.bioma.<dominio-eg>'
$env:BIOMA_SMOKE_EMAIL='<admin de staging>'
$env:BIOMA_SMOKE_PASSWORD='<secret>'
$env:BIOMA_SESSION_COOKIE_NAME='bioma_staging_session'
python bioma\apps\api\scripts\smoke_remote.py
```

Depois valide manualmente no navegador:

- login e logout;
- isolamento entre EG admin e cliente;
- CRUD de cliente, entrega e artefato;
- solicitação e decisão de aprovação;
- ClickUp real em uma lista controlada;
- fila e Performance com uma conta Google controlada;
- desktop, notebook com DevTools e mobile.

## 5. Gate de produção

Produção só começa quando todos estiverem concluídos:

- [ ] ClickUp real comparado com ao menos uma lista controlada.
- [ ] Google Ads, GA4, GSC e GTM comparados com as interfaces oficiais.
- [ ] CRM, financeiro e Performance consumidos no frontend.
- [ ] Usuários cliente podem ser provisionados sem seed ou acesso direto ao banco.
- [ ] Recuperação/rotação de senha e rate limit de login estão ativos.
- [ ] Sessão expirada/revogada, payload inválido e rate limit testados.
- [ ] QA visual humano assinado.
- [ ] Checklist LGPD, DPA, subprocessadores e transferência internacional revisados.
- [ ] Backup e restauração ensaiados.
- [ ] PR `develop -> main` aprovado.

## 6. Produção

Crie ambiente e dados totalmente separados do staging. Nunca clone senhas, seed ou banco de staging.

Se Railway for aprovado:

1. Duplique a topologia para o ambiente `production`.
2. Use `main` como branch.
3. Configure os domínios de produção.
4. Ative backup e PITR conforme o plano escolhido.
5. Execute `bootstrap_admin.py` uma vez.
6. Faça smoke somente leitura antes de liberar operações mutáveis.

Se residência no Brasil for gate, faça antes um ensaio equivalente no Fly `gru`; mantenha API, worker e banco na mesma região e use release command para migrations.

## Rollback

- Aplicação: reverta/redeploy o último commit saudável; migrations devem ser aditivas e retrocompatíveis.
- Banco: não reverta schema destrutivamente durante incidente. Restaure backup/PITR em instância separada, valide e só então troque a conexão.
- Credencial: revogue/rotacione o secret comprometido e redeploy os serviços afetados.
- Sync externo: pause os crons antes de investigar duplicação ou corrupção de dados.
