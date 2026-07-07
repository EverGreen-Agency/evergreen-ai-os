# HANDOFF — Mega Plataforma EG (para iniciar sessões novas)

> Cole isto no começo de uma sessão nova (planejamento OU Fable 5). Atualizado: 2026-07-07.

## Estado atual (já no repo)
- **`ideas.json`: 124 ideias** — umbrella `mega-plataforma` + módulos + irmãs SEPARAR + ~25 demandas da parte 1+2 (jurídico, cofre de senhas, créditos-IA, co-pilot de vendas, revenda, workspace, decisões, jogo→Fóton…). Dashboard já lê `part_of`/`readiness`/category `Platform`.
- **Visão canônica:** `banco_ideias/docs/mega-plataforma.md`. **Decisão D7** em `banco_arquitetura/arquitetura.md`.
- **Trilho:** `engenharia/mega-plataforma/PLANO-MESTRE.md` (ADRs P1–P14 + briefing por módulo + fases + §6 atualização parte 2).
- **`mod-multitenant`:** `engenharia/mod-multitenant/spec.md` (APROVADA) + ADRs 0001–0008. Revisados pelo Juiz: 0003–0008 bons; **0001** com migração strangler; **0002 REFEITO → auth = Supabase**.
- **Inventário de ferramentas externas:** `banco_arquitetura/ferramentas-externas.md`.
- **Convenção de artefatos:** `core/OUTPUT-CONVENTION.md` (run × cliente/lead × módulo de plataforma).
- **Docs-fonte:** `knowledge/inputs-mega-plataforma/` (parte 1/2, PDF HM, análises; pareceres de LLMs em `pareceres-llms/`).

## Decisões travadas
- **Auth = Supabase** (Auth+Postgres+RLS, região BR). **Stack:** Next.js App Router + TS + Tailwind/Shadcn + Drizzle + Postgres + pgvector + BullMQ/Redis. **Migração do cockpit = strangler** (incremental, preservar). **Isolamento = RLS por `tenant_id`.** **Tenancy:** árvore EG→cliente→agência-parceira→cliente-da-agência (+ usuário SaaS independente); orgs/RBAC/entitlements no nosso schema. **Nome (default) = Bioma.** **3 fases por módulo** (interno→cliente→white-label). **Retenção = suspensão de acesso, nunca backdoor.** LLM-agnostic (LiteLLM+PII masking) só quando features de IA entrarem.

## Sessão de PLANEJAMENTO (LLMs especificadoras; Opus é o Juiz no fim)
- Contexto obrigatório: PLANO-MESTRE + `docs/mega-plataforma.md` + `arquitetura.md` + o módulo no `ideas.json` + blueprint PDF HM (em `inputs-mega-plataforma/`). Fluxo: Especificador→Decisor→Scaffolder. **Não** especificar `client-hub`/`bi` antes da fundação.
- Fila (após multitenant): `client-hub` + `mod-bi-dashboards` (Fase 1) → backoffice (financeiro/comercial/contratos/marca/conhecimento) → billing/site → amplos.
- Pendências de ADR transversal: P10 workspace (overreach?), P11 cofre, P12 créditos-IA, P13 revenda-depth, P14 self-host, nome.

## Sessão do FABLE 5 (código)
- Só codar módulo com **spec+ADR aprovados**. **Fundação primeiro: `mod-multitenant`** — Next.js + **Supabase Auth** + Postgres **RLS** + árvore de orgs (4 níveis) + RBAC + `audit_logs` + superfície mínima do tenant. **Evoluir do `dashboard/` atual via strangler** (não big-bang; preservar o cockpit — CA7). Critérios de aceite na `spec.md` (CA1 isolamento/IDOR falha; CA3 token OAuth criptografado; etc.). Depois: `client-hub` + `mod-bi-dashboards` (reusa repo BIAds + blueprint PDF).
- Segurança obrigatória (ver `inputs-mega-plataforma/documentacao-referencia-tecnica.md`): sem `.env` exposto, validação de autorização por recurso (anti-IDOR), upload sanitizado no back-end.

## Aberto p/ Eduardo
- Bater martelo no **nome** (Bioma?). Confirmar **workspace/e-mail próprio** e **jogo** como baixa prioridade. Mover a **planilha pessoal** (`Planilha-Orcamentaria.xlsx`, gitignorada) pro Fóton.
