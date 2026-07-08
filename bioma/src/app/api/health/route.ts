import { NextResponse } from "next/server";

import { runHealthChecks } from "@/server/observability/incidents";

export const dynamic = "force-dynamic";

/**
 * Health check público (CA1/CA5 mod-observabilidade): responde estado sem
 * vazar NADA interno (sem versões, hosts, stack traces). Redis fora = degraded
 * (fila é opcional em dev); Postgres fora = down.
 */
export async function GET() {
  const result = await runHealthChecks();
  return NextResponse.json(result, {
    status: result.status === "down" ? 503 : 200,
  });
}
