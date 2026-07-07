# ADR-0001: Contrato Central de Integrações

- **Status:** proposta
- **Data:** 2026-07-07
- **Projeto / Cliente:** `mod-integrations-hub`
- **Decisores:** Eduardo / Juiz

## Contexto

Meta, Google, LinkedIn, Autentique, ClickUp, Kommo, WhatsApp, Stripe e Drive aparecem em vários módulos. Se cada módulo implementar OAuth, token, webhook e retry sozinho, o Bioma fica frágil e inconsistente.

## Opções Consideradas

1. **Integração por módulo** — prós: rápido localmente. Contras: duplicação, segredos espalhados, erros difíceis de auditar.
2. **Hub central de integrações** — prós: status único, webhooks idempotentes, tokens governados, reuso. Contras: exige contrato comum.
3. **iPaaS externo/n8n como núcleo** — prós: velocidade em automações. Contras: risco de virar core oculto e dificultar produto.

## Decisão

**Escolhemos hub central de integrações com adapters por provedor.**

Módulos não acessam token diretamente. Eles pedem ação/status ao hub. O hub conversa com `cofre-senhas`, `mod-observabilidade` e workers.

## Consequências

- **Ganhamos:** consistência, auditoria e Integration Doctor.
- **Abrimos mão de:** velocidade de hacks isolados por módulo.
- **Passa a exigir:** modelo de provider, connection, scope, webhook_event e sync_job.
- **Reversibilidade:** boa; adapters podem ser substituídos.

## Impacto no Banco de Stack

Nenhum imediato. Conectores específicos podem gerar ADRs próprios.

