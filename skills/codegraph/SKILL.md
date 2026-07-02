---
name: CodeGraph
description: Índice local (grafo) do código — busca semântica de símbolos, dependências e call paths. Substitui grep repetido em bases grandes ou cross-repo.
type: mcp
version: 1.1.6
mcp:
  server_name: codegraph
  command: codegraph
  args:
    - serve
    - --mcp
  transport: stdio
categories:
  - code-intelligence
  - architecture
---

# CodeGraph

Índice local do código (tree-sitter → SQLite), 100% local, sem API key. Configurado no `.mcp.json` do repo. Cada repositório tem seu próprio índice em `.codegraph/` (gitignored), com auto-sync.

## Quando usar
- **Arquiteto — Gate de Alavancagem:** "a gente já construiu isso?" — consulte o grafo em vez de grep, principalmente em base grande ou cross-repo.
- **Engenharia:** entender uma base antes de mexer; blast-radius de uma mudança ("o que quebra se eu mexer em X?").

## Ferramentas MCP
- `codegraph_explore <query em linguagem natural>` — símbolos relevantes + código (com nº de linha) + call paths numa tacada.
- `codegraph_node <símbolo|arquivo>` — um símbolo (fonte + quem chama/é chamado) ou um arquivo com dependentes.

## Setup por repositório
Indexar um projeto: `cd <repo> && codegraph init` (cria `.codegraph/`, auto-sync liga). Este repo (`evergreen-ai-os`) já está indexado. Pra avaliação **cross-repo** (mega plataforma), rode `codegraph init` em cada projeto da EG que você quer trazer pra dentro da avaliação.

## Regra da casa
Fallback: Read/Grep continuam válidas. Use o CodeGraph quando ele economiza tempo (base grande, call paths, blast-radius) — não force em arquivo pequeno.
