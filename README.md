# evergreen-ai-os

Repositório da EverGreen. O produto é o **Bioma**, em [`bioma/`](bioma/README.md) —
API (FastAPI), worker assíncrono e app web (React/Vite). Tudo que o Opensquad
fazia foi absorvido nativamente pelo Bioma; não há mais `/opensquad` neste
repositório.

## Por que o Bioma não está na raiz

A pasta existe por um motivo prático, não por gosto de organização: manter o
histórico de commits e as sessões de copiloto contínuos. Mover `bioma/` para a
raiz quebraria `railway.json` (dois serviços), os Dockerfiles, os caminhos dos
scripts de smoke, `.codegraph/` e `graphify-out/` — trabalho real por um ganho
cosmético. Ver a decisão registrada em `bioma/docs/DECISOES-ABERTAS.md`.

## Onde começar

- [`bioma/README.md`](bioma/README.md) — visão geral do produto
- [`bioma/apps/api/README.md`](bioma/apps/api/README.md) — API
- [`bioma/apps/worker/README.md`](bioma/apps/worker/README.md) — worker assíncrono e agendamento
- [`bioma/apps/web/README.md`](bioma/apps/web/README.md) — app web
- [`bioma/ARCHITECTURE.md`](bioma/ARCHITECTURE.md) — arquitetura
- [`bioma/DEPLOY.md`](bioma/DEPLOY.md) — deploy
- [`bioma/docs/DECISOES-ABERTAS.md`](bioma/docs/DECISOES-ABERTAS.md) — decisões de produto em aberto e já fechadas
