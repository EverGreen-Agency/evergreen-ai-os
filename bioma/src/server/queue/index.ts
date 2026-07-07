/**
 * Fila de jobs assíncronos — BullMQ + Redis (ADR-0007).
 *
 * Regras arquiteturais (valem para TODO job futuro):
 *  - Nenhuma rota Next aguarda job longo: enfileira e devolve 202.
 *  - Payload SEMPRE carrega { tenantId, correlationId } (Zod obriga).
 *  - Retries explícitos + Dead Letter Queue — falha silenciosa é inaceitável.
 *  - Worker NÃO tem passe-livre cross-tenant: todo acesso a dados dentro de um
 *    job deve ser escopado ao tenantId do payload (e auditável).
 */
import { Queue, type ConnectionOptions } from "bullmq";
import { z } from "zod";

export const baseJobPayload = z.object({
  /** null somente para manutenção de plataforma. */
  tenantId: z.string().uuid().nullable(),
  correlationId: z.string().min(8),
});
export type BaseJobPayload = z.infer<typeof baseJobPayload>;

export const QUEUES = {
  system: "bioma-system",
  deadLetter: "bioma-dead-letter",
} as const;

/** REDIS_URL → opções BullMQ (evita instância ioredis própria e conflito de tipos). */
export function redisConnection(): ConnectionOptions {
  const url = new URL(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    ...(url.username ? { username: url.username } : {}),
    ...(url.password ? { password: url.password } : {}),
    ...(url.protocol === "rediss:" ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}

const globalForQueue = globalThis as unknown as {
  queues?: Map<string, Queue>;
};

export function getQueue(name: string): Queue {
  globalForQueue.queues ??= new Map();
  let queue = globalForQueue.queues.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection: redisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 1_000 },
        removeOnFail: false, // preserva para inspeção/DLQ
      },
    });
    globalForQueue.queues.set(name, queue);
  }
  return queue;
}

/** Único jeito aprovado de enfileirar: valida o payload base antes. */
export async function enqueue<T extends BaseJobPayload>(
  queueName: string,
  jobName: string,
  payload: T,
): Promise<string> {
  baseJobPayload.parse(payload);
  const job = await getQueue(queueName).add(jobName, payload);
  return job.id ?? "";
}
