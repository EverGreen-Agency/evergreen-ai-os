/**
 * Client Supabase para Server Components / Server Actions / Route Handlers.
 * Opera COM a sessão do usuário (cookies) → todas as queries passam pelo RLS.
 * Este é o caminho padrão de acesso a dados; o service-role (admin.ts) é exceção.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component (não pode escrever cookie) —
            // o refresh de sessão é responsabilidade do proxy.ts.
          }
        },
      },
    },
  );
}
