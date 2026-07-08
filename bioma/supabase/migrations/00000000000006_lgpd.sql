-- ============================================================================
-- Bioma — mod-lgpd-governanca-dados (fatia N&S) :: classificação + finalidade
-- + consentimento
-- Spec: _opensquad/_memory/engenharia/mod-lgpd-governanca-dados/
--       (spec.md RF1/RF2/RF4 + ADR-0001).
-- Decisão ADR-0001: classificação simples (8 classes) com enforcement nos
-- adapters (o gate de IA externa vive em src/server/ai/policy.ts — RF3/CA1).
-- Segue o padrão canônico de tabela de produto (notes/vault): tenant_id
-- NOT NULL + RLS FORCE + policies por permissão.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enum de classificação de dados (ADR-0001 — as 8 classes iniciais)
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.data_classification as enum
    ('public', 'internal', 'client', 'pii', 'secret', 'financial', 'legal',
     'restricted_ai');
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Classificação nas tabelas de produto existentes (RF1)
--    notes nasce 'internal'; credencial do cofre é SEMPRE 'secret' por padrão
--    (nunca sai para LLM externa — CA1 da spec).
-- ----------------------------------------------------------------------------
alter table public.notes
  add column if not exists classification public.data_classification
    not null default 'internal';

alter table public.vault_credentials
  add column if not exists classification public.data_classification
    not null default 'secret';

-- ----------------------------------------------------------------------------
-- 3. processing_purposes — registro de finalidade + base legal (RF2)
-- ----------------------------------------------------------------------------
create table if not exists public.processing_purposes (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.organizations (id) on delete cascade,
  purpose             text not null,      -- finalidade (descrição operacional)
  legal_basis         text not null,      -- base legal LGPD (art. 7º)
  data_classes        public.data_classification[] not null,
  -- true = dados desta finalidade PODEM ir a LLM externa (exceção explícita,
  -- consultada pelo gate src/server/ai/policy.ts para classes legal/financial).
  external_ai_allowed boolean not null default false,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint processing_purposes_legal_basis_check check (
    legal_basis in ('consentimento', 'legitimo_interesse',
                    'execucao_contrato', 'obrigacao_legal')
  )
);

alter table public.processing_purposes enable row level security;
alter table public.processing_purposes force  row level security;

create index if not exists processing_purposes_tenant_id_idx
  on public.processing_purposes (tenant_id);

drop trigger if exists set_updated_at on public.processing_purposes;
create trigger set_updated_at before update on public.processing_purposes
  for each row execute function app.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. consents — consentimentos por finalidade (RF4)
--    subject_label é PSEUDÔNIMO operacional (ex.: 'cliente-titular') —
--    NUNCA nome/e-mail real aqui (coleta mínima; PII fica fora desta tabela).
-- ----------------------------------------------------------------------------
create table if not exists public.consents (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.organizations (id) on delete cascade,
  purpose_id    uuid not null references public.processing_purposes (id) on delete cascade,
  subject_label text not null,
  granted       boolean not null default true,
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.consents enable row level security;
alter table public.consents force  row level security;

create index if not exists consents_tenant_id_idx
  on public.consents (tenant_id);
create index if not exists consents_purpose_id_idx
  on public.consents (purpose_id);

drop trigger if exists set_updated_at on public.consents;
create trigger set_updated_at before update on public.consents
  for each row execute function app.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Grants — anon nada; authenticated DML (RLS restringe as linhas)
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.processing_purposes to authenticated;
grant select, insert, update, delete on public.consents            to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Policies (padrão vault/notes: lgpd.read p/ SELECT, lgpd.manage p/ escrita,
--    sempre em tenant acessível E ativo; WITH CHECK anti cross-tenant)
-- ----------------------------------------------------------------------------

create policy processing_purposes_select on public.processing_purposes
  for select to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.read')
  );

create policy processing_purposes_insert on public.processing_purposes
  for insert to authenticated
  with check (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.manage')
  );

create policy processing_purposes_update on public.processing_purposes
  for update to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.manage')
  )
  with check (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.manage')
  );

create policy processing_purposes_delete on public.processing_purposes
  for delete to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.manage')
  );

create policy consents_select on public.consents
  for select to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.read')
  );

create policy consents_insert on public.consents
  for insert to authenticated
  with check (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.manage')
  );

create policy consents_update on public.consents
  for update to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.manage')
  )
  with check (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.manage')
  );

create policy consents_delete on public.consents
  for delete to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'lgpd.manage')
  );

-- ----------------------------------------------------------------------------
-- 7. RBAC — lgpd.read / lgpd.manage
--    operator LÊ o registro de governança mas não o altera; client_viewer nada.
--    (Bloco de uuid 'b0000000-0000-0000-0006-…' = migration 6, para não colidir
--    com permissões seedadas por migrations paralelas; on conflict protege.)
-- ----------------------------------------------------------------------------
insert into public.permissions (id, key, description) values
  ('b0000000-0000-0000-0006-000000000001', 'lgpd.read',   'Read processing purposes and consents of an organization.'),
  ('b0000000-0000-0000-0006-000000000002', 'lgpd.manage', 'Create/update processing purposes and grant/revoke consents.')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  ('super_admin',  'lgpd.read'),
  ('super_admin',  'lgpd.manage'),
  ('tenant_admin', 'lgpd.read'),
  ('tenant_admin', 'lgpd.manage'),
  ('operator',     'lgpd.read')
) as m (role_key, perm_key)
join public.roles r on r.key = m.role_key
join public.permissions p on p.key = m.perm_key
on conflict (role_id, permission_id) do nothing;
