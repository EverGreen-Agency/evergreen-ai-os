/**
 * next-intl SEM i18n routing (ADR-0009): app atrás de login não precisa de
 * locale na URL. Ordem: cookie explícito → locale da org ativa → pt-BR.
 */
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const LOCALES = ["pt-BR", "en-US"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "pt-BR";
export const LOCALE_COOKIE = "bioma_locale";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const wanted = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = LOCALES.includes(wanted as AppLocale)
    ? (wanted as AppLocale)
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
