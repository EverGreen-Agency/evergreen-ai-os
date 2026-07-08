/**
 * mod-lgpd — RLS/RBAC: isolamento cross-tenant de finalidades/consentimentos,
 * operator lê mas não gerencia, viewer nada.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Sql } from "postgres";

import { asUser, connect, dbAvailable, ORGS, USERS } from "../helpers/db";

const dbUp = await dbAvailable();
const d = describe.skipIf(!dbUp);

const PURPOSE_ID = "40000000-0000-0000-0000-000000000001";

let sql: Sql;
beforeAll(async () => {
  sql = connect();
  await sql`insert into public.processing_purposes
    (id, tenant_id, purpose, legal_basis, data_classes, created_by)
    values (${PURPOSE_ID}, ${ORGS.alfa}, 'Relatorios de midia para o cliente',
            'execucao_contrato', array['client']::public.data_classification[],
            ${USERS.adminAlfa})
    on conflict (id) do nothing`;
});
afterAll(async () => {
  await sql`delete from public.processing_purposes where id = ${PURPOSE_ID}`;
  await sql?.end();
});

d("mod-lgpd — RLS", () => {
  it("admin e operator do tenant leem finalidades; viewer não vê nada", async () => {
    const admin = await asUser(sql, USERS.adminAlfa, (tx) =>
      tx`select id from public.processing_purposes where tenant_id = ${ORGS.alfa}`,
    );
    expect(admin.length).toBeGreaterThan(0);

    const op = await asUser(sql, USERS.opAlfa, (tx) =>
      tx`select id from public.processing_purposes where tenant_id = ${ORGS.alfa}`,
    );
    expect(op.length).toBeGreaterThan(0);

    const viewer = await asUser(sql, USERS.viewerAlfa, (tx) =>
      tx`select id from public.processing_purposes`,
    );
    expect(viewer.length).toBe(0);
  });

  it("outro tenant não enxerga a finalidade nem por id (IDOR)", async () => {
    const rows = await asUser(sql, USERS.adminClienteBeta, (tx) =>
      tx`select id from public.processing_purposes where id = ${PURPOSE_ID}`,
    );
    expect(rows.length).toBe(0);
  });

  it("operator (só lgpd.read) não cria finalidade", async () => {
    await expect(
      asUser(sql, USERS.opAlfa, (tx) =>
        tx`insert into public.processing_purposes
           (tenant_id, purpose, legal_basis, data_classes)
           values (${ORGS.alfa}, 'tentativa op', 'consentimento',
                   array['internal']::public.data_classification[])`,
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("consent cross-tenant no WITH CHECK falha", async () => {
    await expect(
      asUser(sql, USERS.adminClienteBeta, (tx) =>
        tx`insert into public.consents (tenant_id, purpose_id, subject_label)
           values (${ORGS.alfa}, ${PURPOSE_ID}, 'invasao')`,
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("classification existe nas tabelas de produto com defaults certos", async () => {
    const [note] = await sql`select classification from public.notes limit 1`;
    expect(note.classification).toBe("internal");
    const cols = await sql`select column_default from information_schema.columns
      where table_name = 'vault_credentials' and column_name = 'classification'`;
    expect(cols[0].column_default).toContain("secret");
  });
});
