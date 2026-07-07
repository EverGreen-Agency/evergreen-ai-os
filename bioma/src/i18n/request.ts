/**
 * next-intl SEM i18n routing (ADR-0009): app atrás de login não precisa de
 * locale na URL. Ordem: cookie explícito → pt-BR.
 *
 * Mensagens: TODOS os arquivos messages/<locale>/*.json são mesclados (deep
 * merge). Cada módulo mantém o SEU arquivo (core.json, cockpit.json,
 * vault.json, …) — nunca edite o arquivo de outro módulo; isso permite
 * trabalho paralelo sem conflito.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const LOCALES = ["pt-BR", "en-US"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "pt-BR";
export const LOCALE_COOKIE = "bioma_locale";

type Messages = Record<string, unknown>;

function deepMerge(target: Messages, source: Messages): Messages {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      target[key] = deepMerge(existing as Messages, value as Messages);
    } else {
      target[key] = value;
    }
  }
  return target;
}

async function loadMessages(locale: AppLocale): Promise<Messages> {
  const dir = path.join(process.cwd(), "messages", locale);
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const merged: Messages = {};
  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file), "utf8");
    deepMerge(merged, JSON.parse(raw) as Messages);
  }
  return merged;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const wanted = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = LOCALES.includes(wanted as AppLocale)
    ? (wanted as AppLocale)
    : DEFAULT_LOCALE;

  return { locale, messages: await loadMessages(locale) };
});
