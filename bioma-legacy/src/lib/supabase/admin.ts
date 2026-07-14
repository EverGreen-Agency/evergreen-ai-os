/**
 * Client ADMIN (service role) — BYPASSA RLS. Server-only, jamais no bundle.
 *
 * Regra da casa: só usar depois de uma checagem explícita de autorização
 * (src/server/authz.ts) E com registro em audit_logs. Casos legítimos no 1º
 * corte: criar usuário (auth admin API) e operações de plataforma do
 * super-admin. Todo novo uso precisa de justificativa em code review.
 */
import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY/URL ausentes (server-only)");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
