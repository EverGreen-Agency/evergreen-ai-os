/**
 * Incidentes (mod-observabilidade): "não falhar em silêncio".
 *
 * `reportIncident` usa o client ADMIN (service role) porque os chamadores
 * legítimos NÃO têm sessão de usuário: worker BullMQ (DLQ), health checks e
 * rotinas de plataforma. Uso justificado + payload sem PII/segredo (regra
 * admin.ts). Ack/resolve são ações de usuário e passam pelo RLS normal.
 *
 * Sem `import "server-only"`: o worker roda fora do Next (tsx). Os call-sites
 * de UI ficam em src/server/actions/observability.ts (esses sim server-only).
 */
import { createClient } from "@supabase/supabase-js";

export type IncidentInput = {
  /** null = incidente de plataforma (fila/infra). */
  tenantId: string | null;
  source: "queue.dlq" | "integration.token" | "health" | (string & {});
  severity: "info" | "warning" | "critical";
  title: string;
  /** PROIBIDO PII/segredo — só ids, códigos e contagens. */
  detail?: Record<string, unknown>;
  correlationId?: string;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL/service key ausentes");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function reportIncident(input: IncidentInput): Promise<string | null> {
  try {
    const { data, error } = await adminClient()
      .from("incidents")
      .insert({
        tenant_id: input.tenantId,
        source: input.source,
        severity: input.severity,
        title: input.title,
        detail: input.detail ?? {},
        correlation_id: input.correlationId ?? null,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[observability] falha ao registrar incidente:", error.message);
      return null;
    }
    return data.id;
  } catch (e) {
    // Observabilidade nunca derruba o caminho principal.
    console.error("[observability] reportIncident:", e);
    return null;
  }
}

export type HealthChecks = { db: boolean; redis: boolean };
export type HealthResult = {
  status: "ok" | "degraded" | "down";
  checks: HealthChecks;
};

/** Checagens de saúde compartilhadas entre /api/health e a página de status. */
export async function runHealthChecks(): Promise<HealthResult> {
  const [db, redis] = await Promise.all([checkDb(), checkRedis()]);
  const status = db ? (redis ? "ok" : "degraded") : "down";
  return { status, checks: { db, redis } };
}

async function checkDb(): Promise<boolean> {
  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const { redisConnection } = await import("@/server/queue");
    const conn = redisConnection() as { host?: string; port?: number };
    const net = await import("node:net");
    return await new Promise<boolean>((resolve) => {
      const socket = net.createConnection(
        { host: conn.host ?? "127.0.0.1", port: conn.port ?? 6379, timeout: 1_000 },
        () => {
          socket.end();
          resolve(true);
        },
      );
      socket.on("error", () => resolve(false));
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}
