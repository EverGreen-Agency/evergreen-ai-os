# HANDOFF — Mega Plataforma EG "Bioma" (para iniciar sessões novas)

> Cole isto no começo de uma sessão nova (planejamento OU Fable 5). Atualizado: 2026-07-07.

## Estado atual (já no repo)
- **`ideas.json`: 126 ideias** — umbrella `mega-plataforma` + módulos (category **Platform**, 33 ideias) + irmãs SEPARAR + demandas da parte 1+2. Dashboard já lê `part_of`/`readiness`/category `Platform` com labels em **PT** (Plataforma/Recurso/Serviço/Comercial).
- **Visão canônica:** `banco_ideias/docs/mega-plataforma.md`. **Decisão D7** em `banco_arquitetura/arquitetura.md`.
- **Trilho:** `engenharia/mega-plataforma/PLANO-MESTRE.md` (ADRs P1–P14 + briefing por módulo + fases + §6 atualização parte 2).
- **`mod-multitenant`:** `engenharia/mod-multitenant/spec.md` (APROVADA, com nota §9) + ADRs 0001–0010. Revisados pelo Juiz: 0003–0010 bons (0009 i18n, 0010 theming/white-label do Gemini, aprovados); **0001 e spec CA7 corrigidos 2026-07-07** (ver abaixo — cockpit não é operável, migração é greenfield); **0002 REFEITO → auth = Supabase**.
- **Specs adicionais (Gemini, revisadas/aprovadas):** `mod-comercial`, `mod-conhecimento`, `mod-financeiro`, `mod-observabilidade` (novo módulo — capturado no banco).
- **Inventário de ferramentas externas:** `banco_arquitetura/ferramentas-externas.md`.
- **Convenção de artefatos:** `core/OUTPUT-CONVENTION.md` (run × cliente/lead × módulo de plataforma).
- **Docs-fonte:** `knowledge/inputs-mega-plataforma/` (parte 1/2, análises; pareceres de LLMs em `pareceres-llms/`). PDF HM removido do git (pesado; fica local, gitignorado).
- **Planilha pessoal** movida para fora do repo (`../Planilha-Orcamentaria.xlsx`) — leve pro Fóton.

## Decisões travadas
- **Nome = Bioma** (confirmado pelo Eduardo).
- **Auth = Supabase** (Auth+Postgres+RLS, região BR). **Stack:** Next.js App Router + TS + Tailwind/Shadcn + Drizzle + Postgres + pgvector + BullMQ/Redis.
- **⚠️ Migração = GREENFIELD, não strangler** (correção 2026-07-07): o cockpit atual (`dashboard/`, Vite) **não tem uso operacional** — sem auth, sem operação de negócio real, é só um visualizador local dos bancos internos (ideias/arquitetura/stack). Não há nada crítico a preservar. O Bioma nasce **do zero**, limpo. Telas úteis do cockpit (Banco de Ideias, Tech Radar) são portadas depois **por valor de produto** (Fase 2), não por obrigação de compatibilidade. O Vite antigo pode continuar rodando em paralelo sem pressão.
- **Isolamento = RLS por `tenant_id`.** **Tenancy:** árvore EG→cliente→agência-parceira→cliente-da-agência (+ usuário SaaS independente); orgs/RBAC/entitlements no nosso schema.
- **3 fases por módulo** (interno→cliente→white-label). **Retenção = suspensão de acesso, nunca backdoor.**
- **Workspace/e-mail próprio e jogo interno = baixa prioridade** (confirmado). LLM-agnostic (LiteLLM+PII masking) só quando features de IA entrarem.

## Sessão de PLANEJAMENTO (LLMs especificadoras; Opus é o Juiz no fim)
- Contexto obrigatório: PLANO-MESTRE + `docs/mega-plataforma.md` + `arquitetura.md` + o módulo no `ideas.json` + docs em `inputs-mega-plataforma/`. Fluxo: Especificador→Decisor→Scaffolder. **Não** especificar `client-hub`/`bi` antes da fundação.
- Fila (após multitenant): `client-hub` + `mod-bi-dashboards` (Fase 1) → backoffice (financeiro/comercial/contratos/marca/conhecimento/observabilidade) → billing/site → amplos.
- Pendências de ADR transversal: P10 workspace (baixa prioridade), P11 cofre, P12 créditos-IA, P13 revenda-depth, P14 self-host.
- **Cuidado com escrita concorrente:** se várias LLMs rodam em paralelo, apenas UMA por vez deve escrever no `ideas.json` (já aconteceu de uma reverter a category `Platform` de outra — corrigido, mas evitar repetir).

## Sessão do FABLE 5 (código)
- Só codar módulo com **spec+ADR aprovados**. **Fundação primeiro: `mod-multitenant`**, construída **greenfield** (não migração) — Next.js + **Supabase Auth** + Postgres **RLS** + árvore de orgs (4 níveis) + RBAC + `audit_logs` + superfície mínima do tenant.
- Critérios de aceite na `spec.md` (CA1 isolamento/IDOR falha; CA3 token OAuth criptografado; CA7 publicar corretamente — sem exigência de preservar o cockpit antigo).
- Depois: `client-hub` + `mod-bi-dashboards` (reusa repo BIAds).
- Segurança obrigatória (ver `inputs-mega-plataforma/documentacao-referencia-tecnica.md`): sem `.env` exposto, validação de autorização por recurso (anti-IDOR), upload sanitizado no back-end.

## Aberto p/ Eduardo
- Nenhuma pendência bloqueante — pode iniciar a sessão do Fable 5 no `mod-multitenant`.
