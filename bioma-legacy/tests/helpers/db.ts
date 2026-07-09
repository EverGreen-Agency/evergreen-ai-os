/**
 * Helpers dos testes de RLS: conecta no Postgres local do Supabase como
 * `postgres` (BYPASSRLS) e simula um usuário autenticado dentro de uma
 * transação (`set local role authenticated` + claims JWT), com ROLLBACK ao
 * final — o banco seedado nunca fica sujo.
 */
import postgres, { type Sql, type TransactionSql } from "postgres";

export const DB_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export function connect(): Sql {
  return postgres(DB_URL, { max: 1, onnotice: () => {} });
}

export async function dbAvailable(): Promise<boolean> {
  try {
    const sql = connect();
    await sql`select 1`;
    await sql.end();
    return true;
  } catch {
    return false;
  }
}

class Rollback extends Error {}

/**
 * Roda `fn` como o usuário `userId` (role authenticated + request.jwt.claims),
 * numa transação SEMPRE revertida. Erros de RLS/privilégio propagam para o
 * teste capturar (`expect(...).rejects`).
 */
export async function asUser<T>(
  sql: Sql,
  userId: string,
  fn: (tx: TransactionSql) => Promise<T>,
): Promise<T> {
  let result: T | undefined;
  try {
    await sql.begin(async (tx) => {
      await tx`select set_config(
        'request.jwt.claims',
        ${JSON.stringify({ sub: userId, role: "authenticated" })},
        true
      )`;
      await tx`set local role authenticated`;
      result = await fn(tx);
      throw new Rollback();
    });
  } catch (e) {
    if (!(e instanceof Rollback)) throw e;
  }
  return result as T;
}

// ── uuids fixos do seed (supabase/seed.sql) ─────────────────────────────────
export const USERS = {
  eduardoEg: "00000000-0000-0000-0000-000000000001", // super_admin @ EG
  adminAlfa: "00000000-0000-0000-0000-000000000002", // tenant_admin @ Alfa
  opAlfa: "00000000-0000-0000-0000-000000000003", // operator @ Alfa
  viewerAlfa: "00000000-0000-0000-0000-000000000004", // client_viewer @ Alfa
  adminBeta: "00000000-0000-0000-0000-000000000005", // tenant_admin @ Agência Beta
  adminClienteBeta: "00000000-0000-0000-0000-000000000006", // tenant_admin @ Cliente da Beta
  indieGama: "00000000-0000-0000-0000-000000000007", // tenant_admin @ Indie Gama
} as const;

export const ORGS = {
  eg: "10000000-0000-0000-0000-000000000001",
  alfa: "10000000-0000-0000-0000-000000000002",
  beta: "10000000-0000-0000-0000-000000000003",
  clienteBeta: "10000000-0000-0000-0000-000000000004",
  gama: "10000000-0000-0000-0000-000000000005",
} as const;

export const NOTES = {
  alfa1: "20000000-0000-0000-0000-000000000001",
  clienteBeta1: "20000000-0000-0000-0000-000000000003",
  gama1: "20000000-0000-0000-0000-000000000005",
} as const;
