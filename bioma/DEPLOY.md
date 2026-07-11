# Deploy do Bioma

Este runbook e a fonte operacional para staging e producao do MVP. Ele separa o que pode ser feito por codigo do que depende de conta, dominio e secrets.

## Decisao vigente - 2026-07-11

- **Web:** Vercel.
- **API e Postgres:** Railway, por custo e velocidade no MVP.
- **Worker:** Railway job/service separado somente quando ClickUp/Google tiverem credenciais reais validadas.
- **Fly:** alternativa futura se houver exigencia forte de regiao Brasil, rede privada mais controlada ou postura de producao mais rigida.
- **Redis:** nao e necessario hoje. A fila `sync_runs` e duravel no Postgres.

Railway e o caminho pratico para staging e primeira producao. Fly Managed Postgres fica caro para a fase atual.

## Topologia

```text
Navegador
  -> Vercel: bioma-web
      -> HTTPS publico -> Railway: bioma-api
                          -> Railway Postgres
```

## Dominios e sessao

Preferir web e API sob o mesmo dominio registravel:

| Ambiente | Web | API |
|---|---|---|
| Staging | `staging.bioma.evergreenmkt.com.br` | `api-staging.bioma.evergreenmkt.com.br` |
| Producao | `bioma.<dominio-eg>` | `api.bioma.<dominio-eg>` |

Com isso, usar `SESSION_COOKIE_SECURE=true` e `SESSION_COOKIE_SAMESITE=lax`.

Para deploy temporario sem dominio proprio, `vercel.app` + dominio Railway podem exigir ajuste de cookie/CORS. Nao considerar esse modo como release final.

## Branches

- `develop`: staging.
- `main`: producao, depois de PR aprovado.
- Feature branch: preview web na Vercel; nunca conectar preview a banco de producao.

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

## 2. Preparar Railway staging

Bloqueios humanos: conta Railway autenticada, projeto Railway, dominio EG, secrets e administrador EG para bootstrap.

Estrutura recomendada no Railway:

- Project: `bioma-staging`
- Service: `bioma-api`
- Database: Postgres
- Service futuro: `bioma-worker`

Root directory da API:

```text
bioma/apps/api
```

O arquivo `bioma/apps/api/railway.json` define Dockerfile, start command e healthcheck `/health/ready`.

Start command da API:

```text
python scripts/start.py
```

Esse script roda migrations e depois inicia o Uvicorn no mesmo processo. Nao usar `python scripts/migrate.py && uvicorn ...` no Railway, porque o shell/expansao de porta pode variar e a API pode nunca bindar a porta antes do healthcheck.

Porta:

- nao configure porta no DNS/domino;
- o dominio do Railway aponta para o service;
- a API deve bindar `0.0.0.0:$PORT`;
- se `PORT` nao existir localmente, o fallback e `8000`.

Variaveis da API em staging:

```text
APP_ENV=staging
DATABASE_URL=<injetado pelo Railway Postgres>
CORS_ORIGINS=https://staging.bioma.evergreenmkt.com.br
SESSION_COOKIE_NAME=bioma_staging_session
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=lax
BOOTSTRAP_ADMIN_EMAIL=<email-eg>
BOOTSTRAP_ADMIN_PASSWORD=<senha-aleatoria-16-ou-mais>
BOOTSTRAP_ADMIN_DISPLAY_NAME=<nome>
```

Depois do primeiro deploy, rodar uma unica vez no shell/job da API:

```powershell
python scripts/bootstrap_admin.py
```

Nao rodar `seed_dev.py` em producao. Seed so local ou staging controlado.

`bootstrap_admin.py` existe para criar o primeiro usuario EG admin em staging/producao sem rodar seed demo. Ele deve ser executado uma vez por ambiente, com `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD` definidos. Depois, rotacionar/remover a senha de bootstrap.

## 3. Preparar Vercel staging

Projeto: `bioma-staging`

Root directory:

```text
bioma/apps/web
```

Build:

```text
npm run build
```

Output:

```text
dist
```

Variaveis:

```text
VITE_APP_ENV=staging
VITE_API_BASE_URL=https://api-staging.bioma.evergreenmkt.com.br
```

Quando os dominios finais estiverem configurados, atualizar `CORS_ORIGINS` na API com a URL exata da Vercel/domino.

Validacao em 2026-07-11: as URLs `https://api-staging.bioma.evergreenmkt.com.br/health` e `https://staging.bioma.evergreenmkt.com.br` retornaram `404`.

Diagnostico:

- API: DNS aponta para Railway, mas a resposta tem `x-railway-fallback: true`; associar `api-staging.bioma.evergreenmkt.com.br` ao service `bioma-api` correto no Railway.
- Web: DNS aponta para Vercel, mas a resposta tem `X-Vercel-Error: DEPLOYMENT_NOT_FOUND`; rodar o workflow `Bioma Web Deploy` com secrets corretos para publicar e aplicar o alias de staging.

### Deploy Vercel via GitHub Actions

O workflow `.github/workflows/bioma-web-deploy.yml` faz deploy do web usando credenciais do dono/admin salvas como GitHub Secrets. Isso permite que contribuidores enviem codigo para o GitHub sem exigir seat na Vercel.

Secrets obrigatorios no GitHub:

```text
VERCEL_TOKEN=<token do dono/admin na Vercel>
VERCEL_ORG_ID=<org/team id da Vercel>
VERCEL_PROJECT_ID=<project id do projeto bioma>
```

Secret opcional para sobrescrever o alias de staging:

```text
VERCEL_STAGING_ALIAS=staging.bioma.<dominio-eg>
```

Se `VERCEL_STAGING_ALIAS` nao existir, o workflow usa `staging.bioma.evergreenmkt.com.br` como alias padrao.

Secrets opcionais para o build Vite:

```text
BIOMA_STAGING_API_BASE_URL=https://api-staging.bioma.evergreenmkt.com.br
BIOMA_PRODUCTION_API_BASE_URL=https://api.bioma.<dominio-eg>
```

Se `BIOMA_STAGING_API_BASE_URL` nao existir, o workflow usa `https://api-staging.bioma.evergreenmkt.com.br`. Para producao, configure `BIOMA_PRODUCTION_API_BASE_URL` antes de liberar `main`.

O workflow builda localmente com `npm run build`, copia `dist` para `.vercel/output/static` e faz `vercel deploy --prebuilt`. Nao usar `vercel deploy dist` enquanto o projeto Vercel estiver com Root Directory `bioma/apps/web`, porque a CLI pode aplicar o root novamente e procurar `dist/bioma/apps/web`.

Comportamento:

- push em `develop`: deploy Vercel preview/staging;
- push em `main`: deploy Vercel production com `--prod`;
- execução manual (`workflow_dispatch`): permite escolher `staging` ou `production`.

Se a integracao Git nativa da Vercel estiver ativa no mesmo projeto, desativar o auto-deploy dela ou aceitar que havera deploy duplicado. A fonte de verdade recomendada para o Bioma e o workflow do GitHub.

## 4. Validar staging

```powershell
$env:BIOMA_API_BASE_URL='https://api-staging.bioma.evergreenmkt.com.br'
$env:BIOMA_SMOKE_EMAIL='<admin-de-staging>'
$env:BIOMA_SMOKE_PASSWORD='<secret>'
$env:BIOMA_SESSION_COOKIE_NAME='bioma_staging_session'
python bioma\apps\api\scripts\smoke_remote.py
```

Validar tambem no navegador:

- login/logout;
- isolamento EG/cliente;
- CRUD de cliente, entregas, artefatos, CRM e financeiro;
- aprovacoes;
- Analytics sem dados falsos marcados como reais;
- responsividade desktop, DevTools aberto e mobile.

## 5. Worker e integracoes reais

Nao subir worker continuo antes de existir credencial real.

Quando houver contas controladas:

```powershell
python -m bioma_worker.cli --enqueue-all --drain --days 3
```

No Railway, usar o service `bioma-worker` com root `bioma/apps/worker` e `railway.json`. Para execucao periodica, configurar cron/job no Railway se disponivel no plano; se nao, usar GitHub Actions chamando um endpoint/job autorizado ou executar manualmente ate validar volume.

## 6. Producao

Producao so depois dos gates do `ROADMAP-MVP.md`:

- frontend de CRM, financeiro e Performance conectado;
- ClickUp real validado;
- Google providers validados;
- convite/reset/rate limit;
- QA humano;
- checklist LGPD;
- smoke remoto verde.

Replicar a topologia em outro projeto/ambiente Railway com banco isolado. Nao copiar seed, senha, banco ou token de staging.

## Rollback

- App: redeploy do commit anterior se as migrations forem aditivas e retrocompativeis.
- Banco: restaurar backup em ambiente separado, validar e so entao apontar a API.
- Credencial: revogar/rotacionar secret e redeploy apenas do servico afetado.
- Sync externo: pausar worker/job antes de investigar duplicidade.
