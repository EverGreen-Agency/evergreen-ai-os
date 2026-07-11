# Deploy do Bioma

Este runbook é a fonte operacional para staging e produção. Ele evita que uma nova sessão/LLM confunda ambientes, banco ou credenciais.

## Decisão vigente — 2026-07-11

- **Web:** Vercel.
- **API e banco:** Fly.io, ambos em `gru` (São Paulo).
- **Ambientes:** apps e clusters Managed Postgres totalmente separados para `staging` e `production`.
- **Jobs:** não entram no primeiro deploy vazio. Quando ClickUp/Google tiverem contas controladas, usar uma app worker Fly separada com Cron Manager ou GitHub Actions; não usar uma Machine agendada como garantia de cron de 5 minutos.
- **Redis:** não é necessário hoje. A fila `sync_runs` é durável no Postgres.

Essa escolha mantém uma única plataforma para o runtime backend, reduz a troca Railway → Fly e deixa API/banco na mesma região brasileira. Não usar Postgres não gerenciado em volume para dados de cliente.

## Topologia

```text
Navegador
  └─ Vercel: bioma-web
       └─ HTTPS público → Fly: bioma-api
                            └─ rede privada Fly → Managed Postgres (gru)
```

## Domínios e sessão

Preferir web e API sob o mesmo domínio registrável:

| Ambiente | Web | API |
|---|---|---|
| Staging | `staging.bioma.<dominio-eg>` | `api-staging.bioma.<dominio-eg>` |
| Produção | `bioma.<dominio-eg>` | `api.bioma.<dominio-eg>` |

Com isso, usar `SESSION_COOKIE_SECURE=true` e `SESSION_COOKIE_SAMESITE=lax`. O cookie permanece host-only na API, mas web e API continuam same-site. Não liberar produção em `vercel.app` + `fly.dev`: isso exigiria `SameSite=None` e é mais frágil para autenticação por cookie.

## Estratégia de branches

- `develop`: staging.
- `main`: produção, somente após PR aprovado de `develop`.
- Feature branch: preview de web na Vercel; nunca conectar preview a banco de produção.

## 1. Gate local e CI

```powershell
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

O CI em `.github/workflows/bioma-ci.yml` precisa estar verde antes de qualquer deploy.

## 2. Preparar Fly staging

Pré-requisitos humanos: conta Fly autenticada, organização Fly, domínio EG e um administrador EG para bootstrap. Os nomes abaixo são sugestões e precisam ser únicos globalmente no Fly.

```powershell
flyctl auth login
flyctl apps create bioma-eg-api-staging --org <organizacao-fly>
flyctl mpg create --name bioma-eg-db-staging --org <organizacao-fly> --region gru --plan Basic --volume-size 10
flyctl mpg attach <cluster-id-staging> --app bioma-eg-api-staging --database bioma --username bioma
```

O `attach` grava `DATABASE_URL` como secret na API. Depois configure, sem registrar valores no Git:

```powershell
flyctl secrets set --app bioma-eg-api-staging `
  CORS_ORIGINS=https://staging.bioma.<dominio-eg> `
  BOOTSTRAP_ADMIN_EMAIL=<email-eg> `
  BOOTSTRAP_ADMIN_PASSWORD=<senha-aleatoria-16-ou-mais> `
  BOOTSTRAP_ADMIN_DISPLAY_NAME=<nome>

flyctl deploy bioma\apps\api --config bioma\apps\api\fly.staging.toml --app bioma-eg-api-staging
```

Após o deploy, execute uma única vez no shell da app:

```powershell
flyctl ssh console --app bioma-eg-api-staging -C "python scripts/bootstrap_admin.py"
```

Em seguida, crie na Vercel o projeto `bioma-staging` com root directory `bioma/apps/web`, branch `develop`, build `npm run build`, output `dist` e:

```text
VITE_APP_ENV=staging
VITE_API_BASE_URL=https://api-staging.bioma.<dominio-eg>
```

Somente depois de os dois domínios estarem configurados, atualize `CORS_ORIGINS` com a URL final exata e redeploy a API.

## 3. Validar staging

```powershell
$env:BIOMA_API_BASE_URL='https://api-staging.bioma.<dominio-eg>'
$env:BIOMA_SMOKE_EMAIL='<admin-de-staging>'
$env:BIOMA_SMOKE_PASSWORD='<secret>'
$env:BIOMA_SESSION_COOKIE_NAME='bioma_staging_session'
python bioma\apps\api\scripts\smoke_remote.py
```

Validar também no navegador: login/logout, isolamento EG/cliente, CRUD, aprovação, responsividade e estados vazios. ClickUp e Google só entram após contas de teste, token e mapeamento controlados.

## 4. Produção

Produção só começa depois dos gates do `ROADMAP-MVP.md`: frontend de CRM/financeiro/Performance ligado, integrações validadas, convite/reset/rate limit, QA humano, LGPD e restore drill.

Repita a topologia com nomes e banco novos:

```powershell
flyctl apps create bioma-eg-api-prod --org <organizacao-fly>
flyctl mpg create --name bioma-eg-db-prod --org <organizacao-fly> --region gru --plan Basic --volume-size 10
flyctl mpg attach <cluster-id-prod> --app bioma-eg-api-prod --database bioma --username bioma
flyctl deploy bioma\apps\api --config bioma\apps\api\fly.production.toml --app bioma-eg-api-prod
```

Use `main`, domínio de produção, secrets próprios e `bootstrap_admin.py` uma vez. Não copiar seed, senha, banco ou token de staging.

## Rollback e recuperação

- App: `fly releases` identifica a release saudável; redeploy do commit anterior só funciona com migrations aditivas e retrocompatíveis.
- Banco: restaurar o Managed Postgres em ambiente separado, validar e só então apontar a API; nunca aplicar rollback destrutivo de schema durante incidente.
- Credencial: revogar/rotacionar o secret e redeploy apenas da app afetada.
- Sync externo: pausar o scheduler/worker antes de investigar duplicidade.
