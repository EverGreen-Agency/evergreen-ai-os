/**
 * mod-observabilidade — RLS: incidente de plataforma (tenant null) é só do
 * super-admin; incidente de tenant segue incidents.read; escrita autenticada
 * exige incidents.manage.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Sql } from "postgres";

import { asUser, connect, dbAvailable, ORGS, USERS } from "../helpers/db";

const dbUp = await dbAvailable();
const d = describe.skipIf(!dbUp);

const PLATFORM_INC = "50000000-0000-0000-0000-000000000001";
const ALFA_INC = "50000000-0000-0000-0000-000000000002";

let sql: Sql;
beforeAll(async () => {
  sql = connect();
  await sql`insert into public.incidents (id, tenant_id, source, severity, title)
    values (${PLATFORM_INC}, null, 'queue.dlq', 'critical', 'Job x na DLQ'),
           (${ALFA_INC}, ${ORGS.alfa}, 'integration.token', 'warning', 'Token expirado')
    on conflict (id) do nothing`;
});
afterAll(async () => {
  await sql`delete from public.incidents where id in (${PLATFORM_INC}, ${ALFA_INC})`;
  await sql?.end();
});

d("mod-observabilidade — RLS", () => {
  it("super-admin vê incidentes de plataforma E de tenant", async () => {
    const rows = await asUser(sql, USERS.eduardoEg, (tx) =>
      tx`select id from public.incidents where id in (${PLATFORM_INC}, ${ALFA_INC})`,
    );
    expect(rows.length).toBe(2);
  });

  it("tenant_admin vê o do próprio tenant, mas NÃO o de plataforma", async () => {
    const rows = await asUser(sql, USERS.adminAlfa, (tx) =>
      tx`select id from public.incidents`,
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(ALFA_INC);
    expect(ids).not.toContain(PLATFORM_INC);
  });

  it("outro tenant não vê incidente do Alfa (IDOR)", async () => {
    const rows = await asUser(sql, USERS.adminClienteBeta, (tx) =>
      tx`select id from public.incidents where id = ${ALFA_INC}`,
    );
    expect(rows.length).toBe(0);
  });

  it("tenant_admin (só incidents.read) não faz ack/resolve", async () => {
    const rows = await asUser(sql, USERS.adminAlfa, (tx) =>
      tx`update public.incidents set status = 'resolved'
         where id = ${ALFA_INC} returning id`,
    );
    expect(rows.length).toBe(0);
  });

  it("operator não vê incidentes (sem incidents.read)", async () => {
    const rows = await asUser(sql, USERS.opAlfa, (tx) =>
      tx`select id from public.incidents`,
    );
    expect(rows.length).toBe(0);
  });
});
