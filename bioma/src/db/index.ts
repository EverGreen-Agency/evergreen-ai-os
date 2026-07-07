/**
 * Client Drizzle → Postgres (server-only).
 *
 * ATENÇÃO (RLS): esta conexão usa DATABASE_URL (role postgres em dev) e NÃO
 * passa pelo RLS. Use APENAS em código de servidor que já validou autorização
 * via src/server/authz.ts. Para acesso "como o usuário", prefira o client
 * Supabase (src/lib/supabase/server.ts), que aplica RLS via JWT.
 */
import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  return url;
}

// Singleton: evita esgotar conexões no hot-reload do Next em dev.
const client =
  globalForDb.pgClient ?? postgres(requireDatabaseUrl(), { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
