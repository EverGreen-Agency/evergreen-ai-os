# ADRs Planejados - Fase 1

**Data:** 2026-07-07  
**Status:** backlog de decisões, não ADR aceito  
**Regra:** só escrever/aceitar estes ADRs depois dos guardrails P0.5 mínimos.

## `client-hub`

| ADR | Decisão | Por que importa |
|---|---|---|
| CH-001 | NFC/magic link/session security | cartão NFC abre no celular; precisa expiração, revogação e fallback |
| CH-002 | Entitlements e módulos bloqueados | upsell e acesso por oferta não podem ser if no frontend |
| CH-003 | Aprovações do cliente | aprovar criativos/relatórios precisa trilha, comentário e tenant |
| CH-004 | Client Operating Agreement | ficha viva do cliente: escopo, SLA, canais, limites, módulos e regras |
| CH-005 | Exit/Handover Mode | exportação/handover legítimo quando cliente sair ou mudar de contrato |
| CH-006 | Biblioteca de documentos/arquivos | decidir Drive externo vs storage próprio vs híbrido |

## `mod-bi-dashboards`

| ADR | Decisão | Por que importa |
|---|---|---|
| BI-001 | Build vs embed | Recharts/Tremor/nativo vs Looker/Metabase/Superset/embed |
| BI-002 | Estratégia de coleta | histórico em Postgres/warehouse vs API em tempo real |
| BI-003 | Modelo de métricas e snapshots | evitar duplicidade, timezone errado e métricas incompatíveis |
| BI-004 | Conectores iniciais | Meta/Google/LinkedIn: ordem, escopos OAuth e limites |
| BI-005 | Qualidade de dados | token expirado, dado parcial, anomalia e dashboard vazio |
| BI-006 | Relatórios narrados por IA | quando gerar texto/áudio, com quais fontes e rastreabilidade |

## `mod-entrega-mkt`

| ADR | Decisão | Por que importa |
|---|---|---|
| MKT-001 | Escrita em plataformas externas | pausar campanha/verba/publicar post exige HITL e política |
| MKT-002 | QA pré-publicação | links, UTM, gramática, política de ads e marca antes de ir ao ar |
| MKT-003 | Integração com ClickUp | duplicar gestão de tarefas ou só espelhar estados críticos |
| MKT-004 | Aprovação criativa no Hub | como material vai para aprovação e volta para operação |

## Dependências antes da Fase 1

- `cofre-senhas` aprovado para guardar credenciais e tokens.
- `mod-integrations-hub` aprovado para conexões e status.
- `mod-workflows-aprovacoes` aprovado para HITL.
- `mod-lgpd-governanca-dados` aprovado para classificação/retencao/LLM.
- `mod-observabilidade` aprovado para health, logs e alertas.

