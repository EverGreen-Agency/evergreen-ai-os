/**
 * Gate de IA externa (mod-lgpd CA1): classes proibidas nunca passam;
 * financial/legal exigem finalidade com exceção explícita.
 */
import { describe, expect, it } from "vitest";

import { assertExternalLlmAllowed, classifyDefault, LgpdPolicyError } from "@/server/ai/policy";

const TENANT = "10000000-0000-0000-0000-000000000002";

describe("LGPD — gate de IA externa", () => {
  it.each(["secret", "pii", "restricted_ai"] as const)(
    "bloqueia '%s' SEMPRE (mesmo com finalidade)",
    async (classification) => {
      await expect(
        assertExternalLlmAllowed({ classification, tenantId: TENANT, purposeId: TENANT }),
      ).rejects.toThrow(LgpdPolicyError);
    },
  );

  it.each(["public", "internal", "client"] as const)(
    "permite '%s' sem finalidade",
    async (classification) => {
      await expect(
        assertExternalLlmAllowed({ classification, tenantId: TENANT }),
      ).resolves.toBeUndefined();
    },
  );

  it.each(["financial", "legal"] as const)(
    "'%s' sem purposeId é bloqueado",
    async (classification) => {
      await expect(
        assertExternalLlmAllowed({ classification, tenantId: TENANT }),
      ).rejects.toThrow(/finalidade/i);
    },
  );

  it("classifyDefault: credencial=secret, transcrição=pii, nota=internal", () => {
    expect(classifyDefault("credential")).toBe("secret");
    expect(classifyDefault("transcript")).toBe("pii");
    expect(classifyDefault("note")).toBe("internal");
    expect(classifyDefault("document")).toBe("client");
  });
});
