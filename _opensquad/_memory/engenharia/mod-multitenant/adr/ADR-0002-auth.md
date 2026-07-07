# ADR-0002: Autenticação e Gestão de Organizações (Build vs Buy)

- **Status:** aceita (revisa a v1 que recomendava auth próprio — descartada pelo Juiz)
- **Data:** 2026-07-07
- **Projeto:** `mod-multitenant` (Decisão Transversal P2)
- **Decisores:** Eduardo (delegou a escolha) + Juiz/Opus

> **Nota de revisão:** a 1ª versão deste ADR recomendava **construir a engine de auth própria**. Isso foi **rejeitado** pelo Juiz: rolar auth do zero (login/reset/2FA/JWT/RBAC) é anti-padrão de segurança — exatamente o risco que o `inputs-mega-plataforma/documentacao-referencia-tecnica.md` deste repo alerta (IDOR/ATO/.env exposto em código gerado por IA). "Segurança impenetrável feita em casa" é a frase que antecede vazamento. O contra do Supabase na v1 ("histórico de vazamentos") era FUD sem fonte (Eduardo confirmou: foi má experiência de debug pontual, não razão técnica).

## Contexto
A plataforma exige tenancy hierárquico (EG → cliente → agência-parceira → cliente-da-agência, + usuário SaaS independente — ver ADR-0005), com login, organizações, papéis e permissões (RBAC). Restrições reais: **LGPD/residência de dados**, **custo** (irrisório no MVP), e — explícito do Eduardo — **não fragmentar dependências/configuração no deploy**. O mecanismo de isolamento escolhido é **RLS no Postgres** (ADR-0003).

## Opções Consideradas
1. **Supabase (Auth + Postgres + RLS + Storage)** — prós: all-in-one (menos fragmentação de deploy — a restrição nº1 do Eduardo); **JWT→RLS nativo** (o isolamento do ADR-0003 sai de graça, menos código-cola); **região BR (São Paulo)** para auth **e** dados (melhor LGPD); free tier cobre o MVP; open-source/self-hostável (sem lock-in duro). Contras: RBAC hierárquico é mais manual (construído com policies RLS + custom claims); requer disciplina nas policies. Anel no Banco de Stack: **assess→trial** (entra como Trial neste projeto).
2. **Clerk** — prós: organizations + RBAC turnkey, DX excelente, setup mínimo. Contras: auth guardado nos **EUA** (PII de e-mail; DPA necessário), vendor **extra** (fragmenta — auth separado do banco), custo por MAU escala. Anel: assess.
3. **Auth.js (NextAuth)** — prós: open-source, flexível. Contras: não entrega orgs/RBAC prontos (você constrói); é biblioteca de login, não plataforma de identidade. Anel: assess.
4. **Engine própria (JWT + Drizzle do zero)** — **descartada**: risco de segurança desproporcional, reinventa o resolvido, contradiz o Gate de Alavancagem e o "necessário e suficiente".

## Decisão
**Escolhemos a Opção 1 — Supabase (Auth + Postgres + RLS), região BR.**
Por quê, ligado ao contexto: (a) **menos fragmentação** — auth+banco+storage numa plataforma só, atendendo a restrição explícita de deploy do Eduardo; (b) **RLS nativo via JWT** — o Supabase mapeia `auth.uid()`/custom claims direto nas policies, que é exatamente o isolamento do ADR-0003 (menos glue-code e menos superfície de erro que Clerk+Postgres separados); (c) **residência BR para auth E dados** — resolve a LGPD melhor que o Clerk (que guardaria a PII de auth nos EUA); (d) custo irrisório no MVP. A alternativa principal descartada (**Clerk**) perde por adicionar um vendor de auth separado do banco (fragmentação) e residência de auth nos EUA — vantagens de "orgs turnkey" não compensam, já que a árvore de orgs e os entitlements vivem no nosso schema de qualquer forma (ADR-0005). Auth próprio: risco.

**Como fica o RBAC hierárquico (o "contra" do Supabase):** a árvore de organizações (`organizations.parent_org_id`), `memberships`, `roles`/`permissions` e `entitlements` moram no **nosso schema Postgres**; o Supabase Auth só resolve identidade/sessão e emite o JWT com `tenant_id`/role nas claims; as **policies RLS** aplicam o isolamento por linha. Padrão maduro e bem documentado.

## Consequências
- **Ganhamos:** deploy coeso (1 plataforma), isolamento RLS nativo, residência BR, custo baixo, sem auth caseiro.
- **Abrimos mão de:** orgs/RBAC "turnkey" do Clerk (construímos no schema) — trade-off aceito.
- **Passa a exigir:** disciplina em escrever/testar as policies RLS (CA1: teste de IDOR cross-tenant deve falhar); DPA do Supabase; monitorar custo se escalar.
- **Reversibilidade:** média. Como orgs/RBAC/dados são nossos (no Postgres), trocar só a camada de auth (ex: → WorkOS/Clerk se um cliente enterprise exigir) é factível sem refazer o modelo de dados. **Gatilho de revisão:** exigência de residência de auth diferente, ou RBAC que a RLS não comporte bem.

## Impacto no Banco de Stack
Promove **Supabase** e **PostgreSQL** para **trial** neste projeto (id deste ADR). Registrar `supabase` no `stack.json` (quadrant platforms-infra, ring trial, adr ADR-0002). Reconcilia com ADR-0003 (que já elogiava Supabase+RLS) — sem mais contradição.
