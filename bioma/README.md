# Bioma MVP v0

Bioma é a plataforma operacional da EverGreen. Este repositório interno começa pelo MVP mínimo: cockpit interno EG, Client Hub, ClickUp Bridge, auth simples, Postgres e ambientes separados.

## Estrutura

```text
bioma/
  apps/
    web/      # frontend React/Vite
    api/      # backend FastAPI
    worker/   # jobs assíncronos, quando necessário
  packages/
    contracts/ # contratos OpenAPI/schemas compartilhados
  infra/
    docker-compose.yml
    env/
```

## Stack Decidida

- Frontend: React + Vite + TypeScript.
- Backend: FastAPI + Python.
- Banco: Postgres direto.
- Deploy: Vercel para `apps/web`; Railway para `apps/api`, Postgres, Redis e worker.
- Fly: alternativa futura se houver exigência real de região, runtime ou rede.

## Branding

- Verde Musgo Profundo: `#09231B`
- Amarelo Baunilha Claro: `#FFF4C7`
- Verde Menta Viva: `#3AC97B`
- Tipografia: Helvetica ou fallback compatível.

## Desenvolvimento Local

1. Copie os arquivos de ambiente:

```bash
cp infra/env/api.example.env infra/env/api.local.env
cp infra/env/web.example.env infra/env/web.local.env
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
uvicorn bioma_api.main:app --reload
```

4. Web:

```bash
cd apps/web
npm install
npm run dev
```

## Comunicação Web/API

O MVP usa REST com contratos tipados no frontend (`apps/web/src/lib/api.ts`) e FastAPI no backend. Isso foi escolhido porque o produto ainda é mais operacional do que exploratório: login, aprovações, entregáveis, sync de ClickUp e auditoria são comandos explícitos.

GraphQL pode entrar depois como BFF ou camada de consulta se surgirem telas com múltiplas visões altamente customizáveis, overfetching real ou muitos consumidores externos. A decisão atual preserva essa opção porque o frontend não chama `fetch` direto espalhado pela aplicação; ele passa por um cliente HTTP isolado.

## Observação

`bioma-legacy/` permanece como referência histórica, mas não dita stack, arquitetura ou UX deste MVP.
