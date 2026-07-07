# ADR-0001: Motor Central de Aprovações HITL

- **Status:** proposta
- **Data:** 2026-07-07
- **Projeto / Cliente:** `mod-workflows-aprovacoes`
- **Decisores:** Eduardo / Juiz

## Contexto

O Bioma terá ações sensíveis: revelar senha, publicar case, alterar verba, enviar contrato, aprovar criativo, suspender acesso, executar squad ou liberar módulo. HITL precisa ser enforcement real, não só botão na UI.

## Opções Consideradas

1. **Aprovações por módulo** — prós: simples no começo. Contras: regras divergentes e bypass por API.
2. **Motor central de approval requests** — prós: auditoria única, política server-side, UX consistente. Contras: mais design inicial.
3. **BPM completo** — prós: flexível. Contras: overengineering.

## Decisão

**Escolhemos motor central simples de approval requests.**

Cada ação sensível cria um pedido com contexto, risco, payload resumido e política. A execução só ocorre se o backend validar aprovação vigente.

## Consequências

- **Ganhamos:** HITL confiável e auditável.
- **Abrimos mão de:** automação total em ações de risco.
- **Passa a exigir:** tabela/evento de approvals, policies por ação e integração com cockpit/client-hub.
- **Reversibilidade:** boa; começa simples e pode evoluir para workflow mais rico.

## Impacto no Banco de Stack

Nenhum.

