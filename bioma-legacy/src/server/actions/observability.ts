"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { uuidSchema } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { audit } from "@/server/audit";
import { requirePlatformSuperAdmin } from "@/server/authz";

const incidentActionSchema = z.object({
  incidentId: uuidSchema,
  next: z.enum(["acknowledged", "resolved"]),
});

/** Ack/resolve de incidente — super-admin de plataforma, sempre auditado. */
export async function setIncidentStatusAction(formData: FormData): Promise<void> {
  const parsed = incidentActionSchema.safeParse({
    incidentId: formData.get("incidentId"),
    next: formData.get("next"),
  });
  if (!parsed.success) return;

  try {
    await requirePlatformSuperAdmin();
  } catch {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: updated } = await supabase
    .from("incidents")
    .update({ status: parsed.data.next })
    .eq("id", parsed.data.incidentId)
    .select("id, tenant_id")
    .maybeSingle();
  if (!updated) return;

  await audit({
    tenantId: updated.tenant_id ?? null,
    action:
      parsed.data.next === "acknowledged"
        ? "incident.acknowledged"
        : "incident.resolved",
    resourceType: "incident",
    resourceId: parsed.data.incidentId,
  });

  revalidatePath("/viveiro/status");
}
