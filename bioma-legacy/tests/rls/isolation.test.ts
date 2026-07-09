/**
 * Testes de aceite da fundação multi-tenant (spec mod-multitenant §7).
 * Rodam direto contra o Postgres local do Supabase (supabase start + db reset),
 * simulando usuários autenticados via role/claims — exatamente o que o
 * PostgREST/Supabase faz em produção.
 *
 * CA1 isolamento/IDOR · CA2 papéis · CA4 árvore/white-label · CA5 audit · CA6 suspensão
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Sql } from "postgres";

import {
  asUser,
  connect,
  dbAvailable,
  NOTES,
  ORGS,
  USERS,
} from "../helpers/db";

const dbUp = await dbAvailable();
const d = describe.skipIf(!dbUp);

let sql: Sql;
beforeAll(() => {
  sql = connect();
});
afterAll(async () => {
  await sql?.end();
});

d("CA1 — isolamento por tenant (IDOR deve FALHAR)", () => {
  it("operador do Alfa só lê notes do próprio tenant", async () => {
    const rows = await asUser(sql, USERS.opAlfa, (tx) =>
      tx`select tenant_id from public.notes`,
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.tenant_id === ORGS.alfa)).toBe(true);
  });

  it("IDOR por id direto de outro tenant retorna 0 linhas", async () => {
    const rows = await asUser(sql, USERS.opAlfa, (tx) =>
      tx`select * from public.notes where id = ${NOTES.clienteBeta1}`,
    );
    expect(rows.length).toBe(0);
  });

  it("INSERT apontando tenant_id de outro tenant é rejeitado (WITH CHECK)", async () => {
    await expect(
      asUser(sql, USERS.opAlfa, (tx) =>
        tx`insert into public.notes (tenant_id, title, created_by)
           values (${ORGS.clienteBeta}, 'invasao', ${USERS.opAlfa})`,
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("UPDATE cross-tenant afeta 0 linhas", async () => {
    const rows = await asUser(sql, USERS.opAlfa, (tx) =>
      tx`update public.notes set title = 'hacked'
         where id = ${NOTES.clienteBeta1} returning id`,
    );
    expect(rows.length).toBe(0);
  });

  it("DELETE cross-tenant afeta 0 linhas", async () => {
    const rows = await asUser(sql, USERS.indieGama, (tx) =>
      tx`delete from public.notes where id = ${NOTES.alfa1} returning id`,
    );
    expect(rows.length).toBe(0);
  });

  it("oauth_accounts de outro tenant são invisíveis", async () => {
    // adminAlfa cria (na própria transação) uma conta OAuth do Alfa;
    // o admin do Cliente da Beta não pode enxergá-la nem por id.
    await asUser(sql, USERS.adminAlfa, async (tx) => {
      const [acc] = await tx`insert into public.oauth_accounts
        (tenant_id, provider, encrypted_access_token)
        values (${ORGS.alfa}, 'meta', 'v1.zzz.zzz.zzz') returning id`;
      expect(acc.id).toBeTruthy();
      return acc;
    });
    const rows = await asUser(sql, USERS.adminClienteBeta, (tx) =>
      tx`select * from public.oauth_accounts where tenant_id = ${ORGS.alfa}`,
    );
    expect(rows.length).toBe(0);
  });
});

d("CA2 — RBAC por papel", () => {
  it("client_viewer não escreve notes (sem notes.write)", async () => {
    await expect(
      asUser(sql, USERS.viewerAlfa, (tx) =>
        tx`insert into public.notes (tenant_id, title, created_by)
           values (${ORGS.alfa}, 'viewer tentando', ${USERS.viewerAlfa})`,
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("client_viewer lê notes do próprio tenant (notes.read)", async () => {
    const rows = await asUser(sql, USERS.viewerAlfa, (tx) =>
      tx`select id from public.notes where tenant_id = ${ORGS.alfa}`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it("operator não altera a organização (sem org.manage)", async () => {
    const rows = await asUser(sql, USERS.opAlfa, (tx) =>
      tx`update public.organizations set name = 'pwned'
         where id = ${ORGS.alfa} returning id`,
    );
    expect(rows.length).toBe(0);
  });

  it("operator não cria membership (sem members.manage)", async () => {
    await expect(
      asUser(sql, USERS.opAlfa, (tx) =>
        tx`insert into public.memberships (user_id, org_id, role_id)
           select ${USERS.viewerAlfa}, ${ORGS.alfa}, r.id
           from public.roles r where r.key = 'tenant_admin'`,
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("super-admin EG lista TODAS as orgs; tenant_admin só o próprio escopo", async () => {
    const all = await asUser(sql, USERS.eduardoEg, (tx) =>
      tx`select id from public.organizations`,
    );
    expect(all.length).toBeGreaterThanOrEqual(5);

    const alfaView = await asUser(sql, USERS.adminAlfa, (tx) =>
      tx`select id from public.organizations`,
    );
    expect(alfaView.map((r) => r.id)).toEqual([ORGS.alfa]);
  });

  it("admin da agência Beta vê Beta + descendente, mas NÃO Alfa nem EG", async () => {
    const rows = await asUser(sql, USERS.adminBeta, (tx) =>
      tx`select id from public.organizations order by id`,
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(ORGS.beta);
    expect(ids).toContain(ORGS.clienteBeta);
    expect(ids).not.toContain(ORGS.alfa);
    expect(ids).not.toContain(ORGS.eg);
  });

  it("admin da agência LÊ notes do sub-cliente (tenant_admin desce a árvore)", async () => {
    const rows = await asUser(sql, USERS.adminBeta, (tx) =>
      tx`select id from public.notes where tenant_id = ${ORGS.clienteBeta}`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });
});

d("CA4 — árvore de 4 níveis + white-label", () => {
  it("cadeia EG → Agência Beta → Cliente da Beta existe no schema", async () => {
    const [cb] = await sql`select parent_org_id, org_type from public.organizations
                           where id = ${ORGS.clienteBeta}`;
    expect(cb.org_type).toBe("agency_client");
    expect(cb.parent_org_id).toBe(ORGS.beta);
    const [beta] = await sql`select parent_org_id, org_type from public.organizations
                             where id = ${ORGS.beta}`;
    expect(beta.org_type).toBe("partner_agency");
    expect(beta.parent_org_id).toBe(ORGS.eg);
  });

  it("white-label: cliente-da-agência NÃO enxerga a agência acima", async () => {
    const rows = await asUser(sql, USERS.adminClienteBeta, (tx) =>
      tx`select id from public.organizations`,
    );
    expect(rows.map((r) => r.id)).toEqual([ORGS.clienteBeta]);
  });
});

d("CA5 — audit log append-only", () => {
  it("ator registra ação no próprio nome", async () => {
    const rows = await asUser(sql, USERS.adminAlfa, (tx) =>
      tx`insert into public.audit_logs (tenant_id, actor_user_id, action, resource_type)
         values (${ORGS.alfa}, ${USERS.adminAlfa}, 'org.member_invited', 'membership')
         returning id`,
    );
    expect(rows.length).toBe(1);
  });

  it("não registra em nome de OUTRO ator", async () => {
    await expect(
      asUser(sql, USERS.adminAlfa, (tx) =>
        tx`insert into public.audit_logs (tenant_id, actor_user_id, action)
           values (${ORGS.alfa}, ${USERS.eduardoEg}, 'forjado')`,
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("UPDATE em audit_logs é negado (append-only)", async () => {
    await expect(
      asUser(sql, USERS.adminAlfa, (tx) =>
        tx`update public.audit_logs set action = 'apagado' where true`,
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("DELETE em audit_logs é negado (append-only)", async () => {
    await expect(
      asUser(sql, USERS.adminAlfa, (tx) =>
        tx`delete from public.audit_logs where true`,
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("viewer não lê audit (sem audit.read)", async () => {
    const rows = await asUser(sql, USERS.viewerAlfa, (tx) =>
      tx`select id from public.audit_logs`,
    );
    expect(rows.length).toBe(0);
  });
});

d("CA6 — suspensão bloqueia acesso imediatamente", () => {
  async function setStatus(org: string, status: "active" | "suspended") {
    await sql`update public.organizations set status = ${status} where id = ${org}`;
  }

  it("suspender o tenant corta dados e o próprio contexto da org", async () => {
    await setStatus(ORGS.alfa, "suspended");
    try {
      const notes = await asUser(sql, USERS.adminAlfa, (tx) =>
        tx`select id from public.notes where tenant_id = ${ORGS.alfa}`,
      );
      expect(notes.length).toBe(0);
      const orgs = await asUser(sql, USERS.adminAlfa, (tx) =>
        tx`select id from public.organizations`,
      );
      expect(orgs.length).toBe(0);
    } finally {
      await setStatus(ORGS.alfa, "active");
    }
  });

  it("suspensão desce por herança: suspender a agência bloqueia o sub-cliente", async () => {
    await setStatus(ORGS.beta, "suspended");
    try {
      const rows = await asUser(sql, USERS.adminClienteBeta, (tx) =>
        tx`select id from public.notes where tenant_id = ${ORGS.clienteBeta}`,
      );
      expect(rows.length).toBe(0);
    } finally {
      await setStatus(ORGS.beta, "active");
    }
  });

  it("super-admin EG continua vendo a org suspensa (para reativar)", async () => {
    await setStatus(ORGS.alfa, "suspended");
    try {
      const rows = await asUser(sql, USERS.eduardoEg, (tx) =>
        tx`select id, status from public.organizations where id = ${ORGS.alfa}`,
      );
      expect(rows.length).toBe(1);
      expect(rows[0].status).toBe("suspended");
    } finally {
      await setStatus(ORGS.alfa, "active");
    }
  });
});
