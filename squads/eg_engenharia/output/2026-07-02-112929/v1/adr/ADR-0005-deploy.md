# ADR-0005: Deploy via Docker (docker-compose) self-hosted no servidor do cliente

- **Status:** aceita
- **Data:** 2026-07-02
- **Projeto / Cliente:** rian-pje-trf1
- **Decisores:** Eduardo (EG) + Arquiteto de Decisões EG

## Contexto
RNF §6: aplicação self-hosted; o Rian já roda **Docker** num servidor em casa e quer acesso remoto (desktop/celular). Objetivo de negócio (§2): **solução própria** para controlar custo e manter os dados sob o controle do escritório (dados sensíveis sob NDA).

## Opções Consideradas
1. **Docker + docker-compose** (app + browsers Playwright + DB) — prós: o Rian já usa Docker; portável, isola dependências pesadas (navegadores). contras: exige Docker no host (já tem).
2. **Binário instalável** — prós: sem Docker. contras: inferno de dependências (browsers do Playwright, libs de PDF/cert); contraria o servidor dele.
3. **SaaS hospedado pela EG** — prós: zero setup para ele. contras: contraria "solução própria para controlar custo" e **move dados sensíveis para fora do controle do cliente**.

## Decisão
**Escolhemos Docker/docker-compose self-hosted no servidor do Rian.** A EG entrega imagem + `docker-compose.yml` + documentação de instalação. Descartado SaaS (fere o objetivo de posse/custo e a sensibilidade dos dados sob NDA); binário (frágil por dependências).

## Consequências
- **Ganhamos:** portabilidade, dados sob controle do cliente, deploy reproduzível.
- **Abrimos mão de:** operar a infra por ele (a infra é dele).
- **Passa a exigir:** documentação de instalação clara; atenção ao peso da imagem (browsers).
- **Reversibilidade:** fácil.

## Impacto no Banco de Stack
Nenhum — Docker já é infra-padrão.
