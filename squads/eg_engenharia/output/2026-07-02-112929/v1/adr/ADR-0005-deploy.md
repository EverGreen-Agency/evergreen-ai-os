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

## Atualização (2026-07-02)
Correção de premissa: **Vercel/Railway não implicam necessariamente dados fora do Brasil** — a Vercel oferece região **Brasil (gru1, São Paulo)** e o banco pode ficar em região BR. Logo, o managed é alternativa viável em **residência de dados** (ainda exige DPA + tratar o provedor como subprocessador/operador). A decisão **self-hosted permanece** para a Fase 1 (controle máximo do cliente sobre dado sob sigilo + certificado), mas o **padrão EG (Vercel, região BR)** é a alternativa natural se o Rian preferir managed — com o kit LGPD (DPA/política/termos) como entregável. **Regra de projeto:** identificar restrições de LGPD/residência na spec e escolher hosting **por tier** (backend/dados sensíveis em região BR; frontend livre).

## Impacto no Banco de Stack
Nenhum — Docker já é infra-padrão.
