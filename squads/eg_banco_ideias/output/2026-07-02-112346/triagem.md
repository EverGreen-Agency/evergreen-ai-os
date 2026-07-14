# Triagem - MEGA PLATAFORMA EG

**Run ID:** 2026-07-02-112346
**Data operacional:** 2026-07-02
**Data informada no contexto:** 2026-07-01

## Veredito

VARIACAO / GUARDA-CHUVA NOVA.

A ideia nao e duplicada de uma ideia unica existente. Ela consolida varias frentes ja registradas no banco em uma arquitetura maior: uma plataforma EG com modulos para funcionarios e clientes, usando os ativos ja construidos e previstos como cockpit/dashboard, bancos, squads, kits, clientes, segundo cerebro e automacoes operacionais.

## Registro proposto

**id:** `mega-plataforma-eg`
**title:** Mega Plataforma EG
**category:** Cockpit
**horizon:** NOW
**origin:** internal
**stage:** capture
**archived:** false
**clickup:** false

## Descricao proposta

A Mega Plataforma EG e o produto operacional central da EverGreen: um sistema modular para funcionarios e clientes que transforma o EG AI OS em uma plataforma real de trabalho, gestao e entrega. Ela deve englobar o que ja existe ou esta em construcao, incluindo cockpit/dashboard, Banco de Ideias, Banco de Arquitetura, Banco de Stack, squads operacionais, carteira de clientes, kits/onboarding, comandos via dispatcher, visao de pipeline e mecanismos de handoff entre agentes.

No lado interno, a plataforma deve funcionar como centro de comando da operacao EG: acompanhar squads, ideias, clientes, configuracoes, outputs, memoria, arquitetura e execucao de rotinas. No lado do cliente, deve expor apenas os modulos relevantes: onboarding, status de entregas, relatorios, materiais, solicitacoes, aprovacoes e possivelmente um portal de relacionamento. A plataforma nao deve nascer como um SaaS generico; primeiro precisa servir a operacao real da EG com dogfooding, reduzindo retrabalho, melhorando previsibilidade e criando uma base proprietaria para produto futuro.

O ponto critico e tratar a plataforma como guarda-chuva, nao como um bloco monolitico. Varios itens existentes passam a ser modulos, dependencias ou habilitadores dela. A curadoria inicial deve registrar a ideia como umbrella para que o Arquiteto avalie escopo, reaproveitamento, fronteiras entre interno/cliente, modelo de dados, integrações e o que deve virar projeto de engenharia primeiro.

## Conexoes propostas

**depends_on:**
- `banco-ideias`
- `banco-arquitetura`
- `hub-chat-dispatcher`
- `carteira-clientes`
- `squad-onboarding`
- `squad-engenharia`
- `codegraph`
- `cross-repo-awareness`

**enables:**
- `cockpit-produto`
- `tag-ativacao`
- `idea-bank-auto`
- `clients-clickup-sync`
- `segundo-cerebro`
- `banks-portability`

## Ideias vizinhas identificadas

- `hub-chat-dispatcher`: chat/barra de comando como dispatcher evoluido no dashboard.
- `banco-ideias`: fonte atual para funil de ideias e tela no dashboard.
- `banco-arquitetura`: fonte do porque arquitetural da estrutura EG.
- `carteira-clientes`: controle ativo por cliente, servicos, configs e logs.
- `segundo-cerebro`: contexto 360 graus plugado em Drive/ClickUp/Kommo/transcricoes/propostas.
- `cockpit-produto`: produtizacao futura do cockpit como SaaS vertical.
- `banks-portability`: desacoplamento dos bancos do Opensquad.
- `clients-clickup-sync`: sincronizacao Carteira <-> ClickUp.
- `idea-bank-auto`: banco que se atualiza por sinais reais.
- `web-artifacts-builder`: padrao de UI rica para cockpit, hub e interfaces.

## Operacao recomendada

Registrar como nova ideia guarda-chuva `mega-plataforma-eg`, em `stage: capture`, com documentacao detalhada em `_opensquad/_memory/banco_ideias/docs/mega-plataforma-eg.md`.

Depois do registro, o proximo passo natural e acionar `eg_arquiteto` para avaliar:

1. Se a plataforma deve ser produto unico, cockpit interno expandido, portal de cliente ou composicao modular.
2. Quais modulos entram no MVP.
3. O que ja deve ser reaproveitado do repo.
4. O que precisa virar spec de engenharia.
5. Quais fronteiras existem entre dados internos da EG e dados expostos ao cliente.

## Checkpoint

Pendente de aprovacao de Eduardo antes de escrever em `ideas.json`, regenerar `ideas.md` e criar o doc profundo.
