-- ============================================================================
-- Bioma — cofre-senhas (P0.5) :: vault de credenciais por tenant
-- Spec: _opensquad/_memory/engenharia/cofre-senhas/ (spec.md + ADR-0001)
-- Decisão ADR: camada Bioma + segredo cifrado (AES-256-GCM em src/server/crypto.ts,
-- mesma envelope do oauth_accounts). Banco guarda SÓ ciphertext (CA1); revelar
-- é ação de aplicação gated por permissão 'vault.reveal' + audit com motivo (CA3).
-- Segue o padrão canônico da tabela notes (tenant_id + RLS forçada + policies).
-- ============================================================================

do $$ begin
  create type public.credential_status as enum
    ('active', 'expired', 'compromised', 'revoked', 'rotating');
exception when duplicate_object then null;
end $$;

create table if not exists public.vault_credentials (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.organizations (id) on delete cascade,
  platform                 text not null,      -- ex.: google-ads, meta-bm, kommo (metadado)
  label                    text not null,      -- identificação humana (metadado)
  status                   public.credential_status not null default 'active',
  owner_user_id            uuid references public.profiles (id) on delete set null,
  -- Segredos: SEMPRE ciphertext "v1.<iv>.<tag>.<payload>" — nunca claro (CA1).
  encrypted_username       text,
  encrypted_password       text,
  encrypted_token          text,
  encrypted_recovery_codes text,
  encrypted_notes          text,
  rotated_at               timestamptz,
  created_by               uuid references public.profiles (id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.vault_credentials enable row level security;
alter table public.vault_credentials force  row level security;

create index if not exists vault_credentials_tenant_id_idx
  on public.vault_credentials (tenant_id);
create index if not exists vault_credentials_tenant_status_idx
  on public.vault_credentials (tenant_id, status);

drop trigger if exists set_updated_at on public.vault_credentials;
create trigger set_updated_at before update on public.vault_credentials
  for each row execute function app.set_updated_at();

-- Grants: anon nada; authenticated DML (RLS restringe linhas).
grant select, insert, update, delete on public.vault_credentials to authenticated;

-- Policies ------------------------------------------------------------------

-- CA2/CA1: listar exige vault.read no tenant ATIVO (CA6 de suspensão herda).
create policy vault_credentials_select on public.vault_credentials
  for select to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'vault.read')
  );

-- Cadastro/edição/remoção exigem vault.manage (+ WITH CHECK anti cross-tenant).
create policy vault_credentials_insert on public.vault_credentials
  for insert to authenticated
  with check (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'vault.manage')
  );

create policy vault_credentials_update on public.vault_credentials
  for update to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'vault.manage')
  )
  with check (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'vault.manage')
  );

create policy vault_credentials_delete on public.vault_credentials
  for delete to authenticated
  using (
    tenant_id in (select app.accessible_org_ids())
    and app.is_org_active(tenant_id)
    and app.has_permission(tenant_id, 'vault.manage')
  );

-- RBAC ------------------------------------------------------------------------
-- vault.reveal é permissão SEPARADA de vault.read (CA2: ver metadados ≠ revelar
-- segredo). operator lê o inventário mas NÃO revela; client_viewer nada.
insert into public.permissions (id, key, description) values
  ('b0000000-0000-0000-0000-000000000007', 'vault.read',   'List vault credentials (metadata only).'),
  ('b0000000-0000-0000-0000-000000000008', 'vault.manage', 'Create/update/revoke vault credentials.'),
  ('b0000000-0000-0000-0000-000000000009', 'vault.reveal', 'Reveal decrypted secrets (audited, with reason).')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  ('super_admin',  'vault.read'),
  ('super_admin',  'vault.manage'),
  ('super_admin',  'vault.reveal'),
  ('tenant_admin', 'vault.read'),
  ('tenant_admin', 'vault.manage'),
  ('tenant_admin', 'vault.reveal'),
  ('operator',     'vault.read')
) as m (role_key, perm_key)
join public.roles r on r.key = m.role_key
join public.permissions p on p.key = m.perm_key
on conflict (role_id, permission_id) do nothing;
