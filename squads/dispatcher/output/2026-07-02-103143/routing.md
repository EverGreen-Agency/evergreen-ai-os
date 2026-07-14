# Dispatcher Routing

**Run ID:** 2026-07-02-103143
**Operational date:** 2026-07-02
**User context date:** 2026-07-01
**Request:** Comecar a MEGA PLATAFORMA EG de verdade: sistema com varios modulos para funcionarios e clientes, incorporando cockpit/dashboard, bancos, squads, kits e lacunas futuras.

## Classification

Trilho B - capacidade / projeto novo.

## Rationale

A demanda nao e executar uma rotina ja coberta por um squad existente. E uma plataforma nova e abrangente que pode consolidar capacidades atuais e futuras do EG AI OS. Pela regra canonica do dispatcher, todo projeto novo entra primeiro pelo `eg_banco_ideias` para checar duplicidade, variacoes, conexoes e registrar a ideia antes de passar para arquitetura ou engenharia.

## Recommended Route

1. `eg_banco_ideias` - Curadoria inicial da ideia no banco.
2. `eg_arquiteto` - Avaliacao de negocio e arquitetura, somente depois da curadoria.
3. `eg_engenharia` - Spec, ADRs e scaffold, somente se o Arquiteto recomendar construir e a ideia amadurecer para `stage: project`.

## Checkpoint

Confirmar com Eduardo antes de disparar o proximo squad.
