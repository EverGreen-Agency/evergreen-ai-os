"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { uuidSchema } from "@/lib/validation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthzError, requirePermission, requireUser } from "@/server/authz";
import type { ActionState } from "./orgs";

const createNoteSchema = z.object({
  tenantId: uuidSchema,
  title: z.string().min(1).max(200),
  body: z.string().max(5000).optional(),
});

/** Padrão canônico de escrita de dado de produto: zod → authz → client do usuário (RLS). */
export async function createNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createNoteSchema.safeParse({
    tenantId: formData.get("tenantId"),
    title: formData.get("title"),
    body: formData.get("body") || undefined,
  });
  if (!parsed.success) return { error: "invalid_input" };

  const user = await requireUser();
  try {
    await requirePermission(parsed.data.tenantId, "notes.write");
  } catch (e) {
    return { error: e instanceof AuthzError ? "forbidden" : "unknown" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notes").insert({
    tenant_id: parsed.data.tenantId,
    title: parsed.data.title,
    body: parsed.data.body ?? null,
    created_by: user.id,
  });
  if (error) return { error: "db_error" };

  revalidatePath("/");
  return { ok: true };
}

const deleteNoteSchema = z.object({
  noteId: uuidSchema,
  tenantId: uuidSchema,
});

export async function deleteNoteAction(formData: FormData): Promise<void> {
  const parsed = deleteNoteSchema.safeParse({
    noteId: formData.get("noteId"),
    tenantId: formData.get("tenantId"),
  });
  if (!parsed.success) return;

  try {
    await requirePermission(parsed.data.tenantId, "notes.write");
  } catch {
    return;
  }

  const supabase = await createSupabaseServerClient();
  // RLS: delete cross-tenant afeta 0 linhas mesmo com noteId forjado (CA1).
  await supabase
    .from("notes")
    .delete()
    .eq("id", parsed.data.noteId)
    .eq("tenant_id", parsed.data.tenantId);

  revalidatePath("/");
}
