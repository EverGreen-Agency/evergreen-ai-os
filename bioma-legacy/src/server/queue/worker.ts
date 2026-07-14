/**
 * Processo do worker (roda FORA do Next): `npm run worker`.
 * 1º corte: só o esqueleto + job de exemplo, provando o contrato do ADR-0007
 * (payload com tenantId/correlationId, retries, DLQ).
 */
import { Worker, type Job } from "bullmq";

import { baseJobPayload, getQueue, QUEUES, redisConnection } from "./index";

const worker = new Worker(
  QUEUES.system,
  async (job: Job) => {
    const payload = baseJobPayload.parse(job.data);
    // Logs SEMPRE com tenant/correlation (e nunca PII).
    console.log(
      `[worker] job=${job.name} id=${job.id} tenant=${payload.tenantId ?? "platform"} corr=${payload.correlationId}`,
    );

    switch (job.name) {
      case "system.heartbeat":
        return { ok: true, at: new Date().toISOString() };
      default:
        throw new Error(`Job desconhecido: ${job.name}`);
    }
  },
  { connection: redisConnection(), concurrency: 5 },
);

// Falha esgotou retries → Dead Letter Queue + INCIDENTE (não falhar em silêncio).
worker.on("failed", async (job, err) => {
  if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;
  console.error(`[worker] DLQ job=${job.name} id=${job.id}: ${err.message}`);
  await getQueue(QUEUES.deadLetter).add(`dlq:${job.name}`, {
    original: { name: job.name, id: job.id, data: job.data },
    error: err.message,
    failedAt: new Date().toISOString(),
  });
  const { reportIncident } = await import("@/server/observability/incidents");
  const payload = baseJobPayload.safeParse(job.data);
  await reportIncident({
    tenantId: payload.success ? payload.data.tenantId : null,
    source: "queue.dlq",
    severity: "critical",
    title: `Job ${job.name} esgotou retries e caiu na DLQ`,
    detail: { job_id: job.id, job_name: job.name, error_code: err.name },
    correlationId: payload.success ? payload.data.correlationId : undefined,
  });
});

worker.on("ready", () => console.log("[worker] pronto — fila", QUEUES.system));

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});
