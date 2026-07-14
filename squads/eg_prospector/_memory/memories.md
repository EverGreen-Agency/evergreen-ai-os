# Squad Memory: Prospector EG

> Topo de funil: ICP → caça (MCPs Apollo/Lusha/Clay/Vibe) → score de fit → lista qualificada. Separado do `eg_proposals` (que converte UMA oportunidade em proposta). Write/Read barrier no Kommo.

## Estilo de Escrita

## Design Visual

## Estrutura de Conteúdo

## Proibições Explícitas

## Técnico (específico do squad)
- Fontes via MCP: Apollo (volume), Lusha (sinais/intenção), Clay (cruzamento), Vibe (eventos/gatilhos). Scraping só último recurso.
- Crédito de API custa: nunca buscar sem filtro de ICP aprovado (gate de gasto no step_icp).
- Não escreve no Kommo sozinho — propõe e aguarda aprovação (HITL).
