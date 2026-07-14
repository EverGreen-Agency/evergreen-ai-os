---
name: eg-scan
description: Roda uma pergunta do CodeGraph em TODOS os repos da EG sob uma raiz e devolve um resumo combinado (cross-repo, por repo). Alimenta o Gate de Alavancagem do Arquiteto.
type: script
version: 0.1.0
script:
  path: scripts/eg-scan.mjs
  runtime: node
categories:
  - code-intelligence
  - architecture
---

# eg-scan

Pergunta uma coisa; responde por TODOS os projetos da EG — você não gerencia a lista nem os caminhos.

## Uso
```
node skills/eg-scan/scripts/eg-scan.mjs "já temos módulo de faturamento?"
```
- **Raiz dos projetos:** variável de ambiente `EG_PROJECTS_ROOT`, ou por padrão a pasta-mãe deste repo (ex.: `Desktop/EG`).
- Percorre cada subpasta que é repo git; se tiver `.codegraph/`, roda `codegraph explore -p` e resume; se não, avisa pra rodar `codegraph init` naquele repo.

## Modelo (decisão de Eduardo: por repo, não índice único)
Cada repo tem seu próprio `.codegraph/`. O eg-scan é a COLA que consulta todos e junta — o "lugar central" é o resumo, não um banco fundido.

## Discovery (o que existe vs. o que está clonado)
- **Clonado na máquina** → o próprio scan da raiz (não precisa de gh).
- **O que existe na org** (mesmo não clonado) → `gh repo list EverGreen-Agency` (requer `gh` + `gh auth login`).
