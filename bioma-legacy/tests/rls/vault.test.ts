/**
 * cofre-senhas — testes de aceite (spec §7) na camada de banco:
 * CA1 (sem texto claro / listagem), CA2 (permissões: viewer nada, operator lê
 * mas não gerencia), isolamento cross-tenant, RBAC do reveal (vault.reveal
 * separado de vault.read — o reveal em si é ação de app, testada por ter a
 * permissão só nos papéis certos).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Sql } from "postgres";

import { asUser, connect, dbAvailable, ORGS, USERS } from "../helpers/db";

const dbUp = await dbAvailable();
const d = describe.skipIf(!dbUp);

let sql: Sql;
beforeAll(async () => {
  sql = connect();
  // Credencial de teste no tenant Alfa (como superuser, ciphertext simulado).
  await sql`insert into public.vault_credentials
    (id, tenant_id, platform, label, encrypted_password, created_by)
    values ('30000000-0000-0000-0000-000000000001', ${ORGS.alfa}, 'google-ads',
            'Conta teste', 'v1.aaa.bbb.ccc', ${USERS.adminAlfa})
    on conflict (id) do nothing`;
});
afterAll(async () => {
  await sql`delete from public.vault_credentials
    where id = '30000000-0000-0000-0000-000000000001'`;
  await sql?.end();
});

d("cofre-senhas — RLS e RBAC", () => {
  it("CA2: admin e operator do tenant listam; client_viewer não vê nada", async () => {
    const admin = await asUser(sql, USERS.adminAlfa, (tx) =>
      tx`select id from public.vault_credentials where tenant_id = ${ORGS.alfa}`,
    );
    expect(admin.length).toBeGreaterThan(0);

    const op = await asUser(sql, USERS.opAlfa, (tx) =>
      tx`select id from public.vault_credentials where tenant_id = ${ORGS.alfa}`,
    );
    expect(op.length).toBeGreaterThan(0);

    const viewer = await asUser(sql, USERS.viewerAlfa, (tx) =>
      tx`select id from public.vault_credentials`,
    );
    expect(viewer.length).toBe(0);
  });

  it("CA1/isolamento: outro tenant não enxerga a credencial nem por id", async () => {
    const rows = await asUser(sql, USERS.adminClienteBeta, (tx) =>
      tx`select id from public.vault_credentials
         where id = '30000000-0000-0000-0000-000000000001'`,
    );
    expect(rows.length).toBe(0);
  });

  it("CA2: operator (só vault.read) não cadastra nem edita credencial", async () => {
    await expect(
      asUser(sql, USERS.opAlfa, (tx) =>
        tx`insert into public.vault_credentials (tenant_id, platform, label, encrypted_password)
           values (${ORGS.alfa}, 'meta-bm', 'tentativa op', 'v1.x.y.z')`,
      ),
    ).rejects.toThrow(/row-level security/i);

    const updated = await asUser(sql, USERS.opAlfa, (tx) =>
      tx`update public.vault_credentials set label = 'hack'
         where id = '30000000-0000-0000-0000-000000000001' returning id`,
    );
    expect(updated.length).toBe(0);
  });

  it("RBAC do reveal: vault.reveal só em super_admin/tenant_admin (operator NÃO)", async () => {
    const rows = await sql`
      select r.key as role_key, p.key as perm_key
      from public.role_permissions rp
      join public.roles r on r.id = rp.role_id
      join public.permissions p on p.id = rp.permission_id
      where p.key = 'vault.reveal'`;
    const roles = rows.map((r) => r.role_key).sort();
    expect(roles).toEqual(["super_admin", "tenant_admin"]);
  });

  it("CA1: coluna de segredo guarda só ciphertext versionado (v1.*)", async () => {
    const [row] = await sql`select encrypted_password from public.vault_credentials
      where id = '30000000-0000-0000-0000-000000000001'`;
    expect(row.encrypted_password).toMatch(/^v1\./);
  });
});
