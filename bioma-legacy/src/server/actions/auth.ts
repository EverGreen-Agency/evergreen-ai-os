"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { audit } from "@/server/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
});

export type AuthFormState = { error?: string };

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalid_credentials" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "invalid_credentials" };

  // RF7: login é ação sensível → audit (tenant null: evento de identidade).
  try {
    await audit({ tenantId: null, action: "auth.login" });
  } catch {
    // Usuário sem org de plataforma não pode gravar tenant_id null — ok:
    // o evento de login fica coberto pelos logs do GoTrue (auth.audit_log_entries).
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
