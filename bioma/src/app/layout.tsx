import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

// Fontes 100% locais (globals.css): sans = stack Helvetica Neue; mono = stack
// do sistema. Zero webfont = zero rede/trava no dev (perf 2026-07-08).

export const metadata: Metadata = {
  title: "Bioma",
  description: "Plataforma de operação da EG",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
