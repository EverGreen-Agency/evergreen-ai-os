-- ============================================================================
-- Bioma — mod-observabilidade (fatia N&S) :: incidentes ("não falhar em silêncio")
-- Spec: _opensquad/_memory/engenharia/mod-observabilidade/ (spec.md + ADR-0001).
-- ADR-0001: contrato interno de eventos primeiro; Sentry/BetterStack entram
-- quando houver conta/DPA — atrás do MESMO reportIncident().
-- ============================================================================

do $$ begin
  create type public.incident_severity as enum ('info', 'warning', 'critical');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.incident_status as enum ('open', 'acknowledged', 'resolved');
exception when duplicate_object then null;
end $$;

create table if not exists public.incidents (
  id             uuid primary key default gen_random_uuid(),
  -- null = incidente de PLATAFORMA (infra/fila); não-nulo = escopo do tenant.
  tenant_id      uuid references public.organizations (id) on delete set null,
  source         text not null,           -- ex.: 'queue.dlq', 'integration.token', 'health'
  severity       public.incident_severity not null default 'warning',
  status         public.incident_status not null default 'open',
  title          text not null,
  detail         jsonb not null default '{}'::jsonb,  -- SEM PII/segredo (só ids/códigos)
  correlation_id text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.incidents enable row level security;
alter table public.incidents force  row level security;

create index if not exists incidents_tenant_status_idx
  on public.incidents (tenant_id, status);
create index if not exists incidents_severity_created_idx
  on public.incidents (severity, created_at desc);

drop trigger if exists set_updated_at on public.incidents;
create trigger set_updated_at before update on public.incidents
  for each row execute function app.set_updated_at();

grant select, insert, update on public.incidents to authenticated;
-- sem DELETE: incidente se resolve, não se apaga (trilha operacional).

-- Policies: plataforma (tenant null) é só do super-admin; incidente de tenant
-- é visível a quem tem incidents.read no tenant ATIVO.
create policy incidents_select on public.incidents
  for select to authenticated
  using (
    app.is_platform_super_admin()
    or (
      tenant_id is not null
      and app.is_org_active(tenant_id)
      and app.has_permission(tenant_id, 'incidents.read')
    )
  );

-- Escrita normal é do servidor/worker (service role, bypassa RLS). A policy
-- cobre o caminho autenticado (ack/resolve e report manual).
create policy incidents_insert on public.incidents
  for insert to authenticated
  with check (
    app.is_platform_super_admin()
    or (
      tenant_id is not null
      and app.is_org_active(tenant_id)
      and app.has_permission(tenant_id, 'incidents.manage')
    )
  );

create policy incidents_update on public.incidents
  for update to authenticated
  using (
    app.is_platform_super_admin()
    or (
      tenant_id is not null
      and app.is_org_active(tenant_id)
      and app.has_permission(tenant_id, 'incidents.manage')
    )
  )
  with check (
    app.is_platform_super_admin()
    or (
      tenant_id is not null
      and app.is_org_active(tenant_id)
      and app.has_permission(tenant_id, 'incidents.manage')
    )
  );

-- RBAC ------------------------------------------------------------------------
insert into public.permissions (id, key, description) values
  ('b0000000-0000-0000-0003-000000000001', 'incidents.read',   'Read incidents scoped to an organization.'),
  ('b0000000-0000-0000-0003-000000000002', 'incidents.manage', 'Acknowledge/resolve incidents of an organization.')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  ('super_admin',  'incidents.read'),
  ('super_admin',  'incidents.manage'),
  ('tenant_admin', 'incidents.read')
) as m (role_key, perm_key)
join public.roles r on r.key = m.role_key
join public.permissions p on p.key = m.perm_key
on conflict (role_id, permission_id) do nothing;
