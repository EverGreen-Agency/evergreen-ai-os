# ADR-0001: Stack de Observabilidade, Logs e Status

- **Status:** proposta
- **Data:** 2026-07-07
- **Projeto / Cliente:** `mod-observabilidade`
- **Decisores:** Eduardo / Juiz

## Contexto

O Bioma depende de banco, filas, workers, autenticação, webhooks e integrações externas. Falhas não podem ser descobertas pelo cliente. Precisamos de health checks, crash reporting, logs estruturados, alertas e status page.

## Opções Consideradas

1. **Ferramentas externas maduras** — Sentry para erros/APM leve + BetterStack/Uptime similar para uptime/status. Prós: rápido, padrão de mercado, pouco código próprio. Contras: custo futuro, dados em terceiro, validar DPA/região.
2. **Datadog/New Relic full APM** — prós: muito completo. Contras: custo e complexidade cedo demais.
3. **Observabilidade própria** — prós: controle. Contras: alto risco, manutenção, não é core.

## Decisão

**Escolhemos começar com ferramentas externas maduras e adapters internos.**

Implementar no Bioma um contrato interno de eventos/logs/health, mas não construir APM próprio. A ferramenta final deve ser validada por preço, DPA e região em fonte oficial antes de produção.

## Consequências

- **Ganhamos:** alertas e rastreabilidade cedo.
- **Abrimos mão de:** controle total da stack de observabilidade no MVP.
- **Passa a exigir:** redaction de PII/segredos antes de enviar eventos.
- **Reversibilidade:** média; mantendo contrato interno, trocar ferramenta é viável.

## Impacto no Banco de Stack

Mover ferramenta escolhida para `trial` quando Eduardo aprovar. Nenhuma alteração automática neste ADR.

