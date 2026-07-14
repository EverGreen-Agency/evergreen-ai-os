-- ============================================================================
-- Bioma — seed de DESENVOLVIMENTO LOCAL (supabase db reset).
-- NUNCA rodar em produção: cria usuários com senha conhecida ('senha-dev-123').
-- Monta a árvore CA4: EG (platform) → Alfa (client) / Beta (partner_agency)
--   → Cliente da Beta (agency_client), + Indie Gama (independent).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Organizações (uuids fixos 1000...000N para testes legíveis)
-- ----------------------------------------------------------------------------
insert into public.organizations (id, parent_org_id, org_type, name, slug, branding) values
  ('10000000-0000-0000-0000-000000000001', null,                                   'platform',       'EG',              'eg',           '{"primary_color":"#3B5D3A"}'),
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'client',         'Cliente Alfa',    'cliente-alfa', '{}'),
  ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'partner_agency', 'Agência Beta',    'agencia-beta', '{"primary_color":"#1D4ED8"}'),
  ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'agency_client',  'Cliente da Beta', 'cliente-beta', '{}'),
  ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'independent',    'Indie Gama',      'indie-gama',   '{}')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Usuários de teste (auth.users → trigger app.handle_new_user cria profiles)
--    Senha de todos: senha-dev-123
-- ----------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  u.email, extensions.crypt('senha-dev-123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', u.display_name),
  now(), now(), '', '', '', ''
from (values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'eduardo@eg.dev',        'Eduardo (EG)'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'admin@alfa.dev',        'Admin Alfa'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'op@alfa.dev',           'Operador Alfa'),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'viewer@alfa.dev',       'Viewer Alfa'),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'admin@beta.dev',        'Admin Beta'),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'admin@clientebeta.dev', 'Admin Cliente da Beta'),
  ('00000000-0000-0000-0000-000000000007'::uuid, 'indie@gama.dev',        'Indie Gama')
) as u (id, email, display_name)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.email like '%@%.dev'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 3. Memberships (papéis por org)
-- ----------------------------------------------------------------------------
insert into public.memberships (user_id, org_id, role_id)
select m.user_id::uuid, m.org_id::uuid, r.id
from (values
  -- EG: Eduardo super_admin da plataforma
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'super_admin'),
  -- Cliente Alfa: admin / operator / viewer
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'tenant_admin'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'operator'),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'client_viewer'),
  -- Agência Beta (enxerga descendente Cliente da Beta via tenant_admin)
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'tenant_admin'),
  -- Cliente da Beta (white-label: NÃO enxerga a Beta acima)
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'tenant_admin'),
  -- Indie Gama (usuário SaaS independente)
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', 'tenant_admin')
) as m (user_id, org_id, role_key)
join public.roles r on r.key = m.role_key
on conflict (user_id, org_id) do nothing;

-- ----------------------------------------------------------------------------
-- 4. Notes (dados de produto para provar CA1 — isolamento cross-tenant)
-- ----------------------------------------------------------------------------
insert into public.notes (id, tenant_id, title, body, created_by) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Nota Alfa 1',        'Conteúdo do tenant Cliente Alfa.',    '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Nota Alfa 2',        'Outro conteúdo do Cliente Alfa.',     '00000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Nota Cliente Beta 1','Conteúdo do tenant Cliente da Beta.', '00000000-0000-0000-0000-000000000006'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Nota Cliente Beta 2','Outro conteúdo do Cliente da Beta.',  '00000000-0000-0000-0000-000000000006'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Nota Gama 1',        'Conteúdo do tenant Indie Gama.',      '00000000-0000-0000-0000-000000000007'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', 'Nota Gama 2',        'Outro conteúdo do Indie Gama.',       '00000000-0000-0000-0000-000000000007')
on conflict (id) do nothing;
