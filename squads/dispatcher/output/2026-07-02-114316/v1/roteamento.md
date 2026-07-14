# Dispatcher / Triagem

**Data:** 2026-07-02
**Pedido:** limpar o banco de ideias, identificar projetos/ideias que travam o progresso mas ja foram finalizados, e apontar onde faltam definicoes de pronto e KPIs para avancar projetos.

## Classificacao

Trilho A - tarefa operacional.

## Squad indicado

`eg_banco_ideias`

## Justificativa

O pedido atua sobre a fonte da verdade do Banco de Ideias EG: `_opensquad/_memory/banco_ideias/ideas.json`. A demanda nao pede criar uma capacidade nova; pede auditar, classificar e propor limpeza/atualizacao de ideias e projetos existentes.

## Contexto para o proximo squad

Auditar o banco atual e entregar:

- projetos/ideias provavelmente concluidos;
- itens que parecem estar travando progresso;
- itens sem definicao de pronto;
- itens sem KPIs claros;
- recomendacoes de acao por item: arquivar/concluir, manter, fundir, enriquecer ou promover.

## Decisao pendente

Confirmar com o usuario antes de disparar `eg_banco_ideias`, conforme regra HITL do dispatcher.
