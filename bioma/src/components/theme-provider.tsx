"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Padrão = musgo escuro (aprovado 2026-07-08); claro-baunilha no toggle.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
