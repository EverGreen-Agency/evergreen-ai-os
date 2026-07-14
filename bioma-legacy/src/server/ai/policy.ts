/**
 * Gate de LGPD para IA externa (mod-lgpd-governanca-dados, RF3/CA1).
 *
 * PONTO ÚNICO obrigatório: TODO adapter de LLM/embedding/transcrição externa
 * futuro chama `assertExternalLlmAllowed()` ANTES de enviar qualquer dado
 * para fora. Nenhum módulo chama provedor de IA diretamente (ADR-0008).
 *
 * TODO (quando features de IA entrarem): mascaramento de PII via proxy
 * LLM-agnostic (LiteLLM, ADR-0008) — este gate é onde ele se pluga.
 *
 * Obs.: sem `import "server-only"` de propósito (mesma razão do crypto.ts):
 * o módulo não carrega segredo e precisa ser testável no vitest; o acesso a
 * banco é import dinâmico só no caminho que consulta finalidade.
 */

export type DataClassification =
  | "public"
  | "internal"
  | "client"
  | "pii"
  | "secret"
  | "financial"
  | "legal"
  | "restricted_ai";

/** Classes que NUNCA saem para IA externa (CA1 da spec). */
const EXTERNAL_AI_FORBIDDEN: ReadonlySet<DataClassification> = new Set([
  "secret",
  "pii",
  "restricted_ai",
]);

/** Classes que exigem finalidade registrada com exceção explícita. */
const EXTERNAL_AI_NEEDS_PURPOSE: ReadonlySet<DataClassification> = new Set([
  "financial",
  "legal",
]);

export class LgpdPolicyError extends Error {
  constructor(
    message: string,
    readonly classification: DataClassification,
  ) {
    super(message);
    this.name = "LgpdPolicyError";
  }
}

/**
 * Lança LgpdPolicyError se o dado NÃO pode ir para LLM externa.
 * - secret/pii/restricted_ai: bloqueio absoluto.
 * - financial/legal: só com processing_purpose do tenant com
 *   external_ai_allowed=true (consultado via client do usuário — RLS aplica).
 * - public/internal/client: permitido.
 */
export async function assertExternalLlmAllowed(opts: {
  classification: DataClassification;
  tenantId: string;
  purposeId?: string;
}): Promise<void> {
  const { classification, tenantId, purposeId } = opts;

  if (EXTERNAL_AI_FORBIDDEN.has(classification)) {
    throw new LgpdPolicyError(
      `Dados '${classification}' nunca saem para IA externa (LGPD/CA1)`,
      classification,
    );
  }

  if (EXTERNAL_AI_NEEDS_PURPOSE.has(classification)) {
    if (!purposeId) {
      throw new LgpdPolicyError(
        `Dados '${classification}' exigem finalidade registrada com exceção de IA externa`,
        classification,
      );
    }
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("processing_purposes")
      .select("id, external_ai_allowed, data_classes")
      .eq("id", purposeId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!data || !data.external_ai_allowed) {
      throw new LgpdPolicyError(
        `Finalidade não autoriza IA externa para dados '${classification}'`,
        classification,
      );
    }
    const classes = (data.data_classes ?? []) as DataClassification[];
    if (!classes.includes(classification)) {
      throw new LgpdPolicyError(
        `Finalidade não cobre a classe '${classification}'`,
        classification,
      );
    }
  }
}

/** Classificação default por tipo de dado — módulos novos usam isto. */
export function classifyDefault(
  kind: "note" | "credential" | "document" | "transcript",
): DataClassification {
  switch (kind) {
    case "credential":
      return "secret";
    case "transcript":
      return "pii"; // voz/reunião contém titulares — só entra com consentimento
    case "document":
      return "client";
    case "note":
    default:
      return "internal";
  }
}
