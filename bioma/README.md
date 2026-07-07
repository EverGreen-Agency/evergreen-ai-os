# Bioma — Mega Plataforma EG

Fundação multi-tenant (`mod-multitenant`) da plataforma de operação da EG.
Construída **greenfield** a partir de spec + ADRs aprovados
(`_opensquad/_memory/engenharia/mod-multitenant/`). O contrato de build deste
diretório é o [BUILD-BRIEF.md](./BUILD-BRIEF.md).

## O que este repositório é (e não é)

**É full-stack, não só frontend.** Um único app Next.js serve a interface
(React Server Components) **e** o backend (Server Actions / Route Handlers como
BFF), mais um processo de worker (BullMQ) que roda fora do Next. O banco é
Postgres gerenciado pelo Supabase (Auth + RLS + Storage).

**Não é** o cockpit antigo (`../dashboard/`, Vite). Ver §Destino do dashboard.

## Arquitetura (ADR-0001: Monólito Modular)

Estilo arquitetural: **monólito modular, client-server, em camadas** — com
trabalho assíncrono **orientado a filas** (event/queue-driven) e **enforcement
de segurança empurrado para o banco** (RLS). Não é microsserviços (extração
futura é possível por desenho), não é MVC clássico, não é hexagonal formal.

```text
┌──────────────────────────────────────────────────────────────┐
│ UI — src/app/ + src/components/                              │
│   RSC + Shadcn-style; tokens CSS semânticos (ADR-0010);      │
│   i18n next-intl pt-BR/en-US (ADR-0009)                      │
├──────────────────────────────────────────────────────────────┤
│ BFF — Server Actions (src/server/actions/) + src/proxy.ts    │
│   Zod em toda fronteira; sessão via @supabase/ssr            │
├──────────────────────────────────────────────────────────────┤
│ Domínio server-only — src/server/                            │
│   authz.ts (anti-IDOR por recurso) · audit.ts (RF7/CA5)      │
│   crypto.ts (AES-256-GCM p/ tokens OAuth, CA3)               │
│   queue/ (BullMQ: tenantId+correlationId, retries, DLQ)      │
├──────────────────────────────────────────────────────────────┤
│ Dados — supabase/migrations/ (CANÔNICO: DDL+RLS+funções app.*)│
│   src/db/ (Drizzle = espelho tipado)                         │
│   Postgres com RLS habilitada E FORÇADA em toda tabela;      │
│   isolamento por tenant_id (CA1: IDOR cross-tenant FALHA)    │
└──────────────────────────────────────────────────────────────┘
   fora do request/response: worker BullMQ (npm run worker) ← Redis
```

Duas linhas de defesa, sempre juntas: as server actions validam autorização
**por recurso** (`requirePermission(orgId, perm)`), e mesmo que uma checagem
seja esquecida, a **RLS bloqueia no banco**. O modelo de tenancy (ADR-0005) é a
árvore `EG → cliente → agência-parceira → cliente-da-agência` (+ usuário SaaS
independente), com `organizations.parent_org_id`, `memberships`,
`roles`/`permissions` e `tenant_id` em toda tabela de produto.

## Rodando local

Pré-requisitos: Node 22+, Docker (para o Supabase local).

```bash
npm install
cp .env.example .env.local        # preencha após o `db:start` (ver abaixo)
npm run db:start                  # sobe Supabase local (1ª vez baixa imagens)
npm run db:reset                  # aplica migrations + seed de dev
npm run dev                       # http://localhost:3000
npm run worker                    # (opcional) worker BullMQ — precisa de Redis
```

O `npm run db:start` imprime `anon key`, `service_role key` e URLs — copie para
o `.env.local` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
Gere a `TOKEN_ENCRYPTION_KEY` com o comando comentado no `.env.example`.

Usuários de dev (senha `senha-dev-123` — ver `supabase/seed.sql`):

| e-mail | papel | org |
| --- | --- | --- |
| `eduardo@eg.dev` | super_admin | EG (plataforma) |
| `admin@alfa.dev` / `op@alfa.dev` / `viewer@alfa.dev` | admin / operator / viewer | Cliente Alfa |
| `admin@beta.dev` | tenant_admin | Agência Beta (enxerga o sub-cliente) |
| `admin@clientebeta.dev` | tenant_admin | Cliente da Beta (white-label: não vê a Beta) |
| `indie@gama.dev` | tenant_admin | Indie Gama (SaaS independente) |

## Testes (critérios de aceite da spec)

```bash
npm test          # tudo; os testes RLS exigem o Supabase local de pé
```

- `tests/rls/isolation.test.ts` — **CA1** (isolamento/IDOR falha), **CA2**
  (papéis), **CA4** (árvore 4 níveis + white-label), **CA5** (audit
  append-only), **CA6** (suspensão bloqueia na hora, com herança).
- `tests/unit/crypto.test.ts` — **CA3** (token cifrado, GCM, IV aleatório).

## Segurança (DoD obrigatório)

- `.env*` fora do git (só `.env.example`); service-role key é server-only.
- Anti-IDOR: autorização validada **por recurso** em cada action + RLS.
- Headers de segurança no `next.config.ts`; HSTS em produção.
- Tokens OAuth **sempre** cifrados (AES-256-GCM) antes de tocar o banco.
- `audit_logs` append-only; **sem PII** em metadata/logs.
- Upload (quando existir) valida MIME/extensão no back-end → bucket privado.

## Deploy (CA7)

Produção: projeto Supabase **região São Paulo (sa-east-1)** (LGPD/ADR-0004) +
app Next em host com HTTPS e região BR preferencial. Envs do `.env.example`;
`supabase db push` para aplicar migrations no projeto remoto.

## Destino do `../dashboard/` (cockpit Vite antigo)

O Bioma **não absorve nem refatora** o cockpit: nasce limpo (decisão
greenfield, ADR-0001 §4). O `dashboard/` é **legado intencional** — continua
rodando local, sem prazo. Na Fase 2 (`mod-cockpit-interno`), as telas com valor
real (Banco de Ideias, Tech Radar, Arquitetura, Squads) serão **reconstruídas**
aqui como features (lendo os mesmos bancos JSON internos via adapters,
ADR-0006), e o Vite será aposentado formalmente quando houver equivalentes.

## Próximos módulos (roadmap)

`P0.5`: observabilidade, cofre-senhas, integrations-hub, workflows/aprovações,
LGPD → `P1`: client-hub, BI & dashboards, entrega-mkt. Cada módulo novo copia o
padrão da tabela `notes` (tenant_id + policies) e das actions com
`requirePermission` + `audit`.
