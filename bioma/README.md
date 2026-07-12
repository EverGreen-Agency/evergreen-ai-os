# Bioma MVP v0

Bioma é a plataforma operacional da EverGreen. Este repositório interno começa pelo MVP mínimo: cockpit interno EG, Client Hub, ClickUp Bridge, auth simples, Postgres e ambientes separados.

## Estrutura

```text
bioma/
  apps/
    web/      # app web React/Vite
    api/      # API HTTP FastAPI
    worker/   # jobs assíncronos, quando necessário
  packages/
    contracts/ # contratos OpenAPI/schemas compartilhados
  infra/
    docker-compose.yml
    env/
  DEPLOY.md       # staging, produção e rollback
  EXECUCAO-MVP.md # fila operacional entre LLMs
```

Uso `web` e `api` porque são nomes de deploy e runtime: a interface publicada na Vercel é o app web, e o backend publicado no Railway é a API HTTP. Na prática, `web` equivale ao frontend e `api` equivale ao backend.

## Stack decidida

- Frontend: React + Vite + TypeScript.
- Backend: FastAPI + Python.
- Banco: Postgres direto.
- Fila atual: Postgres (`sync_runs`). Redis permanece opcional para uma evolução futura.
- Deploy definido para o MVP: Vercel para `apps/web`; Railway para API, Postgres e jobs futuros. Redis não é necessário no staging atual.
- Fly fica como alternativa futura se houver exigência real de região Brasil, runtime ou rede.

## Branding

- Verde Musgo Profundo: `#09231B`
- Amarelo Baunilha Claro: `#FFF4C7`
- Verde Menta Viva: `#3AC97B`
- Tipografia: Helvetica ou fallback compatível.

## Desenvolvimento local

1. Copie os arquivos de ambiente:

```bash
cp infra/env/api.example.env infra/env/api.local.env
cp infra/env/web.example.env infra/env/web.local.env
cp infra/env/worker.example.env infra/env/worker.local.env
```

2. Suba banco e Redis locais:

```bash
docker compose -f infra/docker-compose.yml up -d
```

O Docker do banco/Redis não precisa ser recriado a cada mudança de código. Ele fica rodando como infraestrutura local. Recrie quando mudar `infra/docker-compose.yml`, trocar imagem, alterar porta, resetar volume ou quando quiser usar o perfil de app.

Para rodar também API e web via Docker:

```bash
docker compose -f infra/docker-compose.yml --profile app up --build
```

O perfil `app` constrói imagens locais para API e web. Na primeira execução ele baixa imagens base e dependências (`pip install`, `npm ci`), então depende de rede estável. Para desenvolvimento diário, o caminho mais rápido continua sendo Docker apenas para Postgres/Redis e API/web rodando no host com reload.

Se o build Docker falhar em `npm ci` com `ETIMEDOUT`, é falha de rede durante instalação de dependências dentro do container. Rode novamente quando a conexão estabilizar ou use `npm install`/`npm run dev` no host.

3. API:

```bash
cd apps/api
python -m venv .venv
pip install -r requirements.txt
python scripts/migrate.py
python scripts/seed_dev.py
uvicorn bioma_api.main:app --reload
```

4. Web:

```bash
cd apps/web
npm install
npm run dev
```

5. Worker de Performance:

```bash
cd apps/worker
python -m venv .venv
pip install -r requirements.txt
python -m bioma_worker.cli --drain
```

O worker usa `sync_runs` no Postgres como fila durável. A API responde `202 queued`; o processamento Google ocorre fora da requisição HTTP. Para um agendamento incremental, use `python -m bioma_worker.cli --enqueue-all --drain --days 3` em uma job isolada no Railway, somente depois da validação das contas Google.

Para executar o worker sob demanda no Docker:

```bash
docker compose -f infra/docker-compose.yml --profile worker run --rm worker
```

Usuários de desenvolvimento:

- `eduardo@evergreengrowth.com.br` / `senha-dev-123`
- `henrique@hmconexoes.com.br` / `senha-dev-123`

## Storage de arquivos (FILE-001)

Upload de documentos usa um bucket S3-compatible (Cloudflare R2, Backblaze B2 ou AWS S3). Sem as variáveis `STORAGE_S3_*` configuradas, os endpoints de upload/download retornam `503` de forma controlada — o resto da API continua funcionando.

Variáveis (`infra/env/api.local.env`): `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `STORAGE_S3_ENDPOINT_URL`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY`, `STORAGE_S3_FORCE_PATH_STYLE`, `STORAGE_MAX_UPLOAD_MB`.

Para testar localmente sem credenciais de nuvem, suba um MinIO (S3-compatible) com o perfil `storage`:

```bash
docker compose -f infra/docker-compose.yml --profile storage up -d storage
```

Console em `http://localhost:9001` (usuário `bioma-local` / senha `bioma-local-secret`). Crie o bucket `bioma-dev-files` (uma vez) e aponte a API para ele:

```bash
STORAGE_S3_BUCKET=bioma-dev-files
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ENDPOINT_URL=http://localhost:9000
STORAGE_S3_ACCESS_KEY_ID=bioma-local
STORAGE_S3_SECRET_ACCESS_KEY=bioma-local-secret
STORAGE_S3_FORCE_PATH_STYLE=true
```

## Validação

API:

```bash
cd apps/api
python scripts/migrate.py
python scripts/seed_dev.py
python scripts/smoke_api.py
python scripts/smoke_clickup.py
python scripts/smoke_performance.py
python scripts/smoke_files.py  # exige STORAGE_S3_* configurado (ver seção Storage acima)
```

Worker:

```bash
cd apps/worker
python scripts/smoke_worker.py
python scripts/smoke_queue.py
```

Frontend:

```bash
cd apps/web
npm run build
```

## Comunicação Web/API

O MVP usa REST com contratos tipados no frontend (`apps/web/src/lib/api.ts`) e FastAPI no backend. Isso foi escolhido porque o produto ainda é mais operacional do que exploratório: login, aprovações, entregáveis, artefatos, sync de ClickUp e auditoria são comandos explícitos.

GraphQL pode entrar depois como BFF ou camada de consulta se surgirem telas com múltiplas visões altamente customizáveis, overfetching real ou muitos consumidores externos. A decisão atual preserva essa opção porque o frontend não chama `fetch` direto espalhado pela aplicação; ele passa por um cliente HTTP isolado.

## Observação

`bioma-legacy/` permanece como referência histórica, mas não dita stack, arquitetura ou UX deste MVP.
