-- ============================================================================
-- Bioma — mod-multitenant :: migration de fundação
-- Contrato: BUILD-BRIEF.md (raiz do bioma/) + spec mod-multitenant + ADR-0003/0005.
-- Canônico para DDL + RLS + funções. O Drizzle (src/db/schema.ts) é só espelho.
--
-- Convenções:
--  * Todas as tabelas: RLS habilitada E forçada (FORCE — dono também passa por RLS;
--    as funções SECURITY DEFINER funcionam porque o role `postgres` do Supabase
--    tem BYPASSRLS).
--  * Funções helper no schema `app`: SECURITY DEFINER, STABLE, search_path = ''
--    e referências totalmente qualificadas.
--  * Autorização vem das tabelas (memberships), não do JWT (defesa em profundidade).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensões e schemas
-- ----------------------------------------------------------------------------
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists app;

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.org_type as enum
    ('platform', 'client', 'partner_agency', 'agency_client', 'independent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.org_status as enum ('active', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_status as enum ('active', 'suspended');
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Tabelas
-- ----------------------------------------------------------------------------

-- 2.1 organizations — a organização É o tenant (ADR-0005, árvore com self-fk).
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  parent_org_id uuid references public.organizations (id) on delete restrict,
  org_type      public.org_type not null,
  name          text not null,
  slug          text not null unique,
  status        public.org_status not null default 'active',
  branding      jsonb not null default '{}'::jsonb,
  locale        text not null default 'pt-BR',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Sanidade da árvore: plataforma é raiz; cliente-de-agência sempre tem pai.
  constraint organizations_platform_no_parent
    check (org_type <> 'platform' or parent_org_id is null),
  constraint organizations_agency_client_has_parent
    check (org_type <> 'agency_client' or parent_org_id is not null)
);

-- 2.2 profiles — identidade humana global (id = auth.users.id).
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email        text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2.3 RBAC: roles / permissions / role_permissions (referência global,
--     gestão só por migration).
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  name        text,
  description text
);

create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  description text
);

create table if not exists public.role_permissions (
  role_id       uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- 2.4 memberships — user × org × role.
create table if not exists public.memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  org_id     uuid not null references public.organizations (id) on delete cascade,
  role_id    uuid not null references public.roles (id),
  status     public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, org_id)
);

-- 2.5 oauth_accounts — só CIPHERTEXT (AES-256-GCM na camada app, src/server/crypto.ts).
--     NUNCA token em claro no banco (CA3).
create table if not exists public.oauth_accounts (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references public.organizations (id) on delete cascade,
  provider                text not null,
  label                   text,
  encrypted_access_token  text not null,
  encrypted_refresh_token text,
  expires_at              timestamptz,
  created_by              uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- 2.6 audit_logs — APPEND-ONLY (CA5). tenant_id null = ação de plataforma.
--     PROIBIDO PII em metadata (ids sim; e-mail/nome/token não).
create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references public.organizations (id) on delete set null,
  actor_user_id uuid references public.profiles (id) on delete set null,
  action        text not null,
  resource_type text,
  resource_id   text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- 2.7 notes — tabela de produto CANÔNICA (RF5): todo módulo futuro copia este
--     padrão (tenant_id NOT NULL + policies RLS por permissão).
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.organizations (id) on delete cascade,
  title      text not null,
  body       text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. RLS: habilitar E forçar em todas as tabelas
-- ----------------------------------------------------------------------------
alter table public.organizations    enable row level security;
alter table public.organizations    force  row level security;
alter table public.profiles         enable row level security;
alter table public.profiles         force  row level security;
alter table public.roles            enable row level security;
alter table public.roles            force  row level security;
alter table public.permissions      enable row level security;
alter table public.permissions      force  row level security;
alter table public.role_permissions enable row level security;
alter table public.role_permissions force  row level security;
alter table public.memberships      enable row level security;
alter table public.memberships      force  row level security;
alter table public.oauth_accounts   enable row level security;
alter table public.oauth_accounts   force  row level security;
alter table public.audit_logs       enable row level security;
alter table public.audit_logs       force  row level security;
alter table public.notes            enable row level security;
alter table public.notes            force  row level security;

-- ----------------------------------------------------------------------------
-- 4. Índices
-- ----------------------------------------------------------------------------
create index if not exists memberships_user_id_idx        on public.memberships (user_id);
create index if not exists memberships_org_id_idx         on public.memberships (org_id);
create index if not exists organizations_parent_org_id_idx on public.organizations (parent_org_id);
create index if not exists notes_tenant_id_idx            on public.notes (tenant_id);
create index if not exists audit_logs_tenant_created_idx  on public.audit_logs (tenant_id, created_at desc);
create index if not exists oauth_accounts_tenant_id_idx   on public.oauth_accounts (tenant_id);

-- ----------------------------------------------------------------------------
-- 5. Trigger genérica de updated_at
-- ----------------------------------------------------------------------------
create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.organizations;
create trigger set_updated_at before update on public.organizations
  for each row execute function app.set_updated_at();

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function app.set_updated_at();

drop trigger if exists set_updated_at on public.memberships;
create trigger set_updated_at before update on public.memberships
  for each row execute function app.set_updated_at();

drop trigger if exists set_updated_at on public.oauth_accounts;
create trigger set_updated_at before update on public.oauth_accounts
  for each row execute function app.set_updated_at();

drop trigger if exists set_updated_at on public.notes;
create trigger set_updated_at before update on public.notes
  for each row execute function app.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Funções helper (schema app) — SECURITY DEFINER, STABLE, search_path=''
-- ----------------------------------------------------------------------------

-- 6.1 Descendentes de uma org (inclui a própria raiz).
create or replace function app.org_descendants(root uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  with recursive descendants as (
    select o.id
    from public.organizations o
    where o.id = root
    union all
    select c.id
    from public.organizations c
    join descendants d on c.parent_org_id = d.id
  )
  select id from descendants
$$;

-- 6.2 Ancestrais de uma org (inclui a própria org).
create or replace function app.org_ancestors(org uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  with recursive chain as (
    select o.id, o.parent_org_id
    from public.organizations o
    where o.id = org
    union all
    select p.id, p.parent_org_id
    from public.organizations p
    join chain c on p.id = c.parent_org_id
  )
  select id from chain
$$;

-- 6.3 Org ativa = existe E nem ela nem NENHUM ancestral está 'suspended' (CA6:
--     suspensão bloqueia imediatamente e desce por herança).
create or replace function app.is_org_active(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.organizations o where o.id = org)
     and not exists (
       select 1
       from public.organizations o
       where o.id in (select * from app.org_ancestors(org))
         and o.status = 'suspended'
     )
$$;

-- 6.4 Super-admin de plataforma: membership ATIVA com role 'super_admin' numa
--     org org_type='platform' ATIVA.
create or replace function app.is_platform_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id
    join public.organizations o on o.id = m.org_id
    where m.user_id = (select auth.uid())
      and m.status = 'active'
      and r.key = 'super_admin'
      and o.org_type = 'platform'
      and o.status = 'active'
  )
$$;

-- 6.5 Orgs que o usuário autenticado enxerga:
--     (a) super_admin de plataforma → TODAS (inclusive suspensas — precisa
--         conseguir reativar; exceção prevista no brief/CA6);
--     (b) membership ativa em org ATIVA: tenant_admin → org + DESCENDENTES;
--         demais papéis (operator/client_viewer) → só a própria org.
--     IMPORTANTE (white-label, CA4): NUNCA inclui ancestrais — cliente-da-agência
--     não enxerga a agência; agência não enxerga a EG.
create or replace function app.accessible_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select o.id
  from public.organizations o
  where app.is_platform_super_admin()
  union
  select acc.org_id
  from public.memberships m
  join public.roles r on r.id = m.role_id
  cross join lateral (
    select m.org_id
    union all
    select d.id
    from app.org_descendants(m.org_id) as d(id)
    where r.key = 'tenant_admin'
      and d.id <> m.org_id
  ) as acc(org_id)
  where m.user_id = (select auth.uid())
    and m.status = 'active'
    and app.is_org_active(acc.org_id)
$$;

-- 6.6 has_permission: super-admin de plataforma; OU membership ativa DIRETA em
--     target_org cujo role tem a permission; OU membership tenant_admin (com a
--     permission) numa org ANCESTRAL (admin de agência gerencia sub-clientes).
--     Caminhos não-super-admin exigem target_org ativa (app.is_org_active cobre
--     também os ancestrais — logo a org do membership ancestral também está ativa).
create or replace function app.has_permission(target_org uuid, perm text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.is_platform_super_admin()
      or (
        app.is_org_active(target_org)
        and exists (
          select 1
          from public.memberships m
          join public.roles r on r.id = m.role_id
          join public.role_permissions rp on rp.role_id = m.role_id
          join public.permissions p on p.id = rp.permission_id
          where m.user_id = (select auth.uid())
            and m.status = 'active'
            and p.key = perm
            and (
              m.org_id = target_org
              or (
                r.key = 'tenant_admin'
                and m.org_id in (select * from app.org_ancestors(target_org))
              )
            )
        )
      )
$$;

-- 6.7 Helper para a policy de SELECT de profiles: o profile alvo tem membership
--     em alguma org acessível ao usuário corrente. (SECURITY DEFINER para não
--     ser filtrado pela RLS de memberships dentro da policy.)
create or replace function app.profile_in_accessible_org(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = profile_id
      and m.org_id in (select app.accessible_org_ids())
  )
$$;

-- 6.8 Trigger padrão Supabase: cria profile ao criar auth.users.
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ----------------------------------------------------------------------------
-- 7. Grants — revoke padrão e concessão explícita (RLS restringe as linhas)
-- ----------------------------------------------------------------------------
-- anon: NADA nas tabelas. authenticated: só o necessário por operação.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select, insert, update         on public.organizations    to authenticated; -- sem delete (fora do 1º corte)
grant select, update                 on public.profiles         to authenticated; -- insert só via trigger definer
grant select                         on public.roles            to authenticated;
grant select                         on public.permissions      to authenticated;
grant select                         on public.role_permissions to authenticated;
grant select, insert, update, delete on public.memberships      to authenticated;
grant select, insert, update, delete on public.oauth_accounts   to authenticated;
grant select, insert                 on public.audit_logs       to authenticated;
grant select, insert, update, delete on public.notes            to authenticated;

-- CA5 (cinto e suspensório): audit_logs é append-only também no nível de privilégio.
revoke update, delete on public.audit_logs from authenticated, anon;

-- Schema app: usage + execute só para authenticated (e nada para public/anon).
grant usage on schema app to authenticated;
revoke execute on all functions in schema app from public, anon;
alter default privileges in schema app revoke execute on functions from public;

grant execute on function app.org_descendants(uuid)          to authenticated;
grant execute on function app.org_ancestors(uuid)            to authenticated;
grant execute on function app.is_org_active(uuid)            to authenticated;
grant execute on function app.is_platform_super_admin()      to authenticated;
grant execute on function app.accessible_org_ids()           to authenticated;
grant execute on function app.has_permission(uuid, text)     to authenticated;
grant execute on function app.profile_in_accessible_org(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 8. Policies RLS (nomeadas, uma por operação)
-- ----------------------------------------------------------------------------

-- 8.1 organizations -----------------------------------------------------------

-- CA2 (papéis: super-admin lista tenants; tenant admin só o seu) +
-- CA4 (white-label: sem ancestrais) +
-- CA6 (org suspensa some para papéis comuns; super_admin vê tudo para reativar).
create policy organizations_select on public.organizations
  for select to authenticated
  using (id in (select app.accessible_org_ids()));

-- CA2/CA4: criar filho exige gerir o pai (org.manage no pai). Org raiz platform
-- só via service role/seed (parent_org_id null é bloqueado aqui de propósito).
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (
    parent_org_id is not null
    and app.has_permission(parent_org_id, 'org.manage')
  );

-- CA2 + CA6/RF9: update (inclui status) exige org.manage; app.has_permission
-- devolve true para super_admin mesmo com a org suspensa (senão não reativa).
-- Na prática a suspensão vem por server action com service role + audit.
create policy organizations_update on public.organizations
  for update to authenticated
  using (app.has_permission(id, 'org.manage'))
  with check (app.has_permission(id, 'org.manage'));

-- (sem policy de DELETE — remoção de org fora do 1º corte; sem grant também.)

-- 8.2 profiles ----------------------------------------------------------------

-- CA1/CA2: o próprio profile OU profiles que compartilham org acessível
-- (colegas de tenant; admin de agência vê perfis dos sub-clientes).
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or app.profile_in_accessible_org(id)
  );

-- CA2: só o próprio usuário edita o próprio profile.
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- (sem policy de INSERT para authenticated — profile nasce via trigger definer.)

-- 8.3 roles / permissions / role_permissions -----------------------------------

-- CA2: referência global de RBAC, legível por qualquer autenticado;
-- escrita só por migration (sem policies nem grants de escrita).
create policy roles_select on public.roles
  for select to authenticated
  using (true);

create policy permissions_select on public.permissions
  for select to authenticated
  using (true);

create policy role_permissions_select on public.role_permissions
  for select to authenticated
  using (true);

-- 8.4 memberships ---------------------------------------------------------------

-- CA2: vê as próprias memberships OU as do escopo que gerencia (members.manage,
-- inclusive via tenant_admin ancestral — agência gerencia sub-clientes).
create policy memberships_select on public.memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or app.has_permission(org_id, 'members.manage')
  );

-- CA2: convidar/criar membership exige members.manage na org alvo.
create policy memberships_insert on public.memberships
  for insert to authenticated
  with check (app.has_permission(org_id, 'members.manage'));

-- CA2: alterar papel/status exige members.manage (USING e WITH CHECK).
create policy memberships_update on public.memberships
  for update to authenticated
  using (app.has_permission(org_id, 'members.manage'))
  with check (app.has_permission(org_id, 'members.manage'));

-- CA2: remover membro exige members.manage.
create policy memberships_delete on public.memberships
  for delete to authenticated
  using (app.has_permission(org_id, 'members.manage'));

-- 8.5 oauth_accounts -------------------------------------------------------------

-- CA1/CA3/CA6: tokens (ciphertext) só para quem tem oauth.manage no tenant ATIVO.
-- is_org_active explícito: nem super_admin opera contas de tenant suspenso.
create policy oauth_accounts_select on public.oauth_accounts
  for select to authenticated
  using (
    app.has_permission(tenant_id, 'oauth.manage')
    and app.is_org_active(tenant_id)
  );

create policy oauth_accounts_insert on public.oauth_accounts
  for insert to authenticated
  with check (
    app.has_permission(tenant_id, 'oauth.manage')
    and app.is_org_active(tenant_id)
  );

create policy oauth_accounts_update on public.oauth_accounts
  for update to authenticated
  using (
    app.has_permission(tenant_id, 'oauth.manage')
    and app.is_org_active(tenant_id)
  )
  with check (
    app.has_permission(tenant_id, 'oauth.manage')
    and app.is_org_active(tenant_id)
  );

create policy oauth_accounts_delete on public.oauth_accounts
  for delete to authenticated
  using (
    app.has_permission(tenant_id, 'oauth.manage')
    and app.is_org_active(tenant_id)
  );

-- 8.6 audit_logs -----------------------------------------------------------------

-- CA5: o ator só registra em nome próprio; tenant_id null (ação de plataforma)
-- só para super_admin; senão o tenant precisa estar acessível.
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (
    actor_user_id = (select auth.uid())
    and (
      (tenant_id is null and app.is_platform_super_admin())
      or tenant_id in (select app.accessible_org_ids())
    )
  );

-- CA5: leitura só para super_admin de plataforma ou quem tem audit.read no tenant.
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (
    app.is_platform_super_admin()
    or (tenant_id is not null and app.has_permission(tenant_id, 'audit.read'))
  );

-- CA5: NENHUMA policy de UPDATE/DELETE — append-only (e privilégios revogados na §7).

-- 8.7 notes — PADRÃO CANÔNICO de tabela de produto (copiar em módulos futuros) ----

-- CA1 (isolamento) + CA2 (notes.read) + CA6 (tenant ativo).
create policy notes_select on public.notes
  for select to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'notes.read')
  );

-- CA1 (WITH CHECK impede gravar em outro tenant) + CA2 (notes.write) + CA6.
create policy notes_insert on public.notes
  for insert to authenticated
  with check (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'notes.write')
  );

-- CA1 + CA2 + CA6 (USING filtra linhas de outros tenants → 0 rows afetadas).
create policy notes_update on public.notes
  for update to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'notes.write')
  )
  with check (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'notes.write')
  );

-- CA1 + CA2 + CA6.
create policy notes_delete on public.notes
  for delete to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'notes.write')
  );

-- ----------------------------------------------------------------------------
-- 9. Seed de referência (dados de SISTEMA — não de dev; dev fica em seed.sql)
-- ----------------------------------------------------------------------------
insert into public.roles (id, key, name, description) values
  ('a0000000-0000-0000-0000-000000000001', 'super_admin',   'Super Admin',   'Platform-wide administrator (EG staff).'),
  ('a0000000-0000-0000-0000-000000000002', 'tenant_admin',  'Tenant Admin',  'Administers an organization and its descendants.'),
  ('a0000000-0000-0000-0000-000000000003', 'operator',      'Operator',      'Works inside a single organization (read/write product data).'),
  ('a0000000-0000-0000-0000-000000000004', 'client_viewer', 'Client Viewer', 'Read-only access to a single organization.')
on conflict (key) do nothing;

insert into public.permissions (id, key, description) values
  ('b0000000-0000-0000-0000-000000000001', 'org.manage',     'Create/update organizations (including children and status).'),
  ('b0000000-0000-0000-0000-000000000002', 'members.manage', 'Invite, update and remove members of an organization.'),
  ('b0000000-0000-0000-0000-000000000003', 'oauth.manage',   'Manage connected OAuth accounts (ciphertext only).'),
  ('b0000000-0000-0000-0000-000000000004', 'audit.read',     'Read the audit log of an organization.'),
  ('b0000000-0000-0000-0000-000000000005', 'notes.read',     'Read notes of an organization.'),
  ('b0000000-0000-0000-0000-000000000006', 'notes.write',    'Create/update/delete notes of an organization.')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  -- super_admin → todas
  ('super_admin',   'org.manage'),
  ('super_admin',   'members.manage'),
  ('super_admin',   'oauth.manage'),
  ('super_admin',   'audit.read'),
  ('super_admin',   'notes.read'),
  ('super_admin',   'notes.write'),
  -- tenant_admin → gestão completa do próprio escopo
  ('tenant_admin',  'org.manage'),
  ('tenant_admin',  'members.manage'),
  ('tenant_admin',  'oauth.manage'),
  ('tenant_admin',  'audit.read'),
  ('tenant_admin',  'notes.read'),
  ('tenant_admin',  'notes.write'),
  -- operator → produto
  ('operator',      'notes.read'),
  ('operator',      'notes.write'),
  -- client_viewer → leitura
  ('client_viewer', 'notes.read')
) as m (role_key, perm_key)
join public.roles r on r.key = m.role_key
join public.permissions p on p.key = m.perm_key
on conflict (role_id, permission_id) do nothing;
