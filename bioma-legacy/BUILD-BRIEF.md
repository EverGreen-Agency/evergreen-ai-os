# BUILD-BRIEF — Bioma / mod-multitenant (fundação)

> **Contrato de build.** Todo agente que trabalhar neste app DEVE ler este arquivo inteiro antes de escrever código.
> Fontes da verdade: `_opensquad/_memory/engenharia/mod-multitenant/spec.md` + `adr/ADR-0001..0010` + `_opensquad/_memory/engenharia/mega-plataforma/HANDOFF.md`. Este brief resume as decisões vinculantes.

## O que é

Fundação multi-tenant da Mega Plataforma EG ("Bioma"), **greenfield** (não migra o `dashboard/` Vite). Só o `mod-multitenant`: identidade, árvore de orgs, RBAC, isolamento RLS, audit log, superfície mínima do tenant. client-hub/BI/billing vêm DEPOIS, em cima disto.

## Stack (travada — ADR-0001/0002/0003/0007)

- **Next.js App Router** (v16, `src/`) + **TypeScript strict** + **Tailwind v4** + **Shadcn/UI**.
- **Supabase**: Auth + Postgres + RLS + Storage. Região **São Paulo (BR)** em produção (LGPD, ADR-0004). Local: `supabase start` (CLI + Docker).
- **Drizzle ORM** para queries tipadas no app. **Migrations SQL canônicas em `supabase/migrations/`** (RLS/policies/funções vivem em SQL — Drizzle schema é espelho para tipos, não gera migration).
- **BullMQ + Redis** para jobs assíncronos (só infraestrutura neste corte).
- **Zod** em toda fronteira (server actions, route handlers, payloads de job).
- **next-intl** (ADR-0009): nada de texto hardcoded — sempre `t("chave")`; `messages/pt-BR.json` + `messages/en-US.json`. Modo **sem i18n routing** (cookie/preferência, sem prefixo de URL).
- **next-themes** + CSS variables semânticas (ADR-0010): NUNCA cor fixa (`bg-blue-500` proibido); sempre tokens (`bg-primary`, `text-muted-foreground`). Dark/light via classe `dark` no `<html>`. White-label: Server Component injeta `<style>` sobrescrevendo `--primary`/logo a partir de `organizations.branding`.

## Modelo de dados (ADR-0005)

Árvore de organizações — a organização É o tenant:

```
EG (org_type=platform, parent NULL)          ← super-admin da plataforma
 ├── Cliente Direto (org_type=client)
 ├── Usuário SaaS Independente (org_type=independent)
 └── Agência Parceira (org_type=partner_agency)
      └── Cliente da Agência (org_type=agency_client)
```

Tabelas núcleo (schema `public`, todas com RLS **habilitada e forçada**):

- `organizations` — id uuid, `parent_org_id` (fk self), `org_type` enum acima, name, slug unique, `status` ('active'|'suspended'), `branding` jsonb (primary_color, logo_url), locale default 'pt-BR', timestamps.
- `profiles` — id uuid **= auth.users.id**, display_name, email espelhado, timestamps. (Identidade humana global; senha/sessão são do Supabase Auth.)
- `roles` — seed global: `super_admin`, `tenant_admin`, `operator`, `client_viewer`. `permissions` + `role_permissions` (RBAC por chave, ex.: `org.manage`, `members.manage`, `notes.read`, `notes.write`, `audit.read`).
- `memberships` — user_id × org_id × role_id, status ('active'|'suspended'), unique(user_id, org_id).
- `oauth_accounts` — `tenant_id` fk orgs, provider, label, `encrypted_access_token` / `encrypted_refresh_token` (**texto cifrado AES-256-GCM — NUNCA token em claro no banco**; chave em env `TOKEN_ENCRYPTION_KEY`, cifra na camada app `src/server/crypto.ts`), expires_at, created_by.
- `audit_logs` — **append-only** (sem UPDATE/DELETE via policy), `tenant_id` nullable (ação de plataforma), actor_user_id, action, resource_type, resource_id, metadata jsonb (**PROIBIDO PII em metadata** — ids sim, e-mail/nome/token não), created_at.
- `notes` — tabela de produto **exemplo/canônica** (prova o padrão tenant): id, `tenant_id` NOT NULL, title, body, created_by, timestamps. Todo módulo futuro copia este padrão.

**Regra absoluta (RF5):** toda tabela de dados de produto carrega `tenant_id NOT NULL REFERENCES organizations(id)` + policies RLS.

## Isolamento RLS (ADR-0003) — o coração do módulo

- Funções helper em schema `app` (SECURITY DEFINER, STABLE, `search_path` fixado):
  - `app.accessible_org_ids()` → org_ids que o usuário autenticado enxerga: membership ativa + expansão por papel (`super_admin` na org platform → todas; `tenant_admin`/`operator`/`client_viewer` → a própria org; tenant_admin também enxerga **descendentes** da própria org — agência vê seus sub-clientes).
  - `app.is_org_active(org_id)` → false se a org OU qualquer ancestral estiver `suspended` (CA6: suspensão bloqueia imediato, sem esperar refresh de token).
  - `app.has_permission(org_id, perm_key)` → junta membership→role→role_permissions.
- Policies padrão de tabela de produto (ex.: `notes`): SELECT exige `tenant_id IN app.accessible_org_ids() AND app.is_org_active(tenant_id)`; INSERT/UPDATE/DELETE exigem o mesmo + `app.has_permission(tenant_id, 'notes.write')` + WITH CHECK do `tenant_id`.
- **Autorização vem das tabelas (memberships), não só do JWT** — claims no JWT (custom access token hook com `active_org_id`) são conveniência de UX; a RLS não confia nelas para autorizar (defesa em profundidade + suspensão instantânea).
- White-label perfeito: cliente-da-agência NÃO enxerga a agência acima dele; agência NÃO enxerga clientes da EG.
- Personificação (super-admin acessando painel de tenant) → SEMPRE gera `audit_logs`.

## Auth (ADR-0002)

- `@supabase/ssr` com cookies; clients em `src/lib/supabase/{server,client,middleware}.ts`; middleware renova sessão.
- **Service-role key só em módulo server-only** (`import "server-only"`), NUNCA em bundle client, NUNCA prefixada `NEXT_PUBLIC_`.
- Login e-mail+senha. Sessão expira (config Supabase). SSO federado: fora do 1º corte.
- Gate de suspensão no layout autenticado (além da RLS): org suspensa → tela de bloqueio, sem dados.

## Segurança obrigatória (DoD — documentacao-referencia-tecnica.md)

1. **Sem `.env` exposto**: só `.env.example` commitado; `.env*` no `.gitignore`; zero segredo hardcoded.
2. **Anti-IDOR / Zero Trust**: nenhuma rota/action confia em ID vindo do cliente — sempre validar autorização por recurso (RLS + checagem explícita `app.has_permission`). **CA1: teste de acesso cross-tenant deve FALHAR.**
3. **Upload sanitizado no back-end** (quando existir — logo de branding): validar MIME/extensão no servidor, salvar em bucket Supabase Storage privado, nunca em diretório executável. Neste corte, upload ainda não entra; o helper/regra fica documentado.
4. Headers de segurança no `next.config.ts` (nosniff, frame-deny, referrer-policy, HSTS em prod).
5. Sem PII em logs (nem em `audit_logs.metadata`).

## Critérios de aceite (spec §7) — o build só está pronto quando:

- **CA1** — usuário do tenant A não lê/escreve dado do tenant B por nenhuma rota/ID (teste automatizado de RLS).
- **CA2** — papéis aplicados (operator ≠ admin; super-admin lista tenants; tenant admin só o seu).
- **CA3** — login funciona; sessão expira; token OAuth persistido cifrado (dump não vaza claro).
- **CA4** — árvore com 4 níveis no schema; cliente-da-agência sob agência sob EG funciona.
- **CA5** — ações sensíveis aparecem em `audit_logs`.
- **CA6** — suspensão de tenant bloqueia acesso imediatamente.
- **CA7** — publicável em ambiente web (região BR), HTTPS. (Deploy real fica com o Eduardo; o app deve estar pronto: envs documentadas, build passando.)

## Convenções do repositório bioma/

```
bioma/
  supabase/            # config.toml, migrations/*.sql (CANÔNICO p/ DDL+RLS), seed.sql
  src/
    db/                # schema.ts (Drizzle, espelho), client servidor
    lib/supabase/      # clients ssr/browser/middleware
    server/            # server-only: crypto.ts, audit.ts, authz.ts, actions/, queue/
    i18n/  messages/   # next-intl (pt-BR default, en-US)
    components/        # ui/ (shadcn) + próprios — só tokens semânticos
    app/               # rotas: (public)/login, (app)/…, (app)/admin/…
  tests/               # vitest: rls/ (via postgres local), unit/ (crypto etc.)
```

- Server actions: sempre `zod.parse` no input + `requireUser()`/`requirePermission()` antes de tocar dado + `audit()` nas ações sensíveis (login, CRUD org/usuário, papel, conexão de conta, suspensão — RF7).
- Jobs BullMQ: payload obrigatório `{ tenantId, correlationId }` (Zod), retries explícitos + DLQ; worker NÃO tem passe-livre cross-tenant (usa client com contexto de tenant, não service-role cru; exceções documentadas).
- Commits pequenos; código e identificadores em inglês; strings de UI via i18n (pt-BR default).
