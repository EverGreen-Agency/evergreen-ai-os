# Triagem - Bioma MVP v0

**Squad:** eg_banco_ideias  
**Agente:** Curador  
**Data:** 2026-07-09  
**Pedido:** reconciliar o Banco de Ideias após o reset enxuto do Bioma MVP v0, validar duplicatas e regenerar a view humana `ideas.md`.

## Veredito

Veredito: VARIAÇÃO / RECORTE OPERACIONAL de `mega-plataforma`, já aprovada pelo usuário.

Registro validado: `bioma-mvp-v0` · Platform · NOW · origin internal

Conexões:

- `part_of`: `mega-plataforma`
- `depends_on`: `mega-plataforma`, `client-hub`, `mod-cockpit-interno`, `clients-clickup-sync`
- `enables`: `client-hub`, `mod-integrations-hub`, `mod-cockpit-interno`

## Checagens

- Total de ideias após o registro: 149.
- Duplicatas de `id`: nenhuma encontrada.
- Referências quebradas em `depends_on`, `enables` ou `part_of`: nenhuma encontrada.
- Claims herdados de "produção no bioma/" removidos do `ideas.json`.

## Ajustes Confirmados

- `clients-clickup-sync` passou a representar o ClickUp Bridge do Bioma MVP v0.
- `mod-cockpit-interno`, `mod-nucleo`, `mod-multitenant`, `client-hub`, `mod-integrations-hub`, `mod-workflows-aprovacoes`, `cofre-senhas` e `mod-lgpd-governanca-dados` foram alinhados ao reset enxuto.
- `mod-bi-dashboards` ficou como base futura, mas com readiness v0 limitado a snapshots/embeds/import manual.

## Checkpoint

Checkpoint considerado aprovado nesta execução porque o usuário pediu explicitamente: "pode rodar o eg_banco_ideias" e "Rode realmente seguindo o framework do opensquad".

