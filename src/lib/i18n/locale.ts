import "server-only";
import { cookies, headers } from "next/headers";
import type { Locale } from "./types";

export type { Locale };

export const DEFAULT_LOCALE: Locale = "ta";
export const LOCALE_COOKIE_NAME = "nalam_locale";

/**
 * Parses an Accept-Language header and picks the first supported locale.
 * Defaults to Tamil (not English) when the header is absent or ambiguous —
 * this is a Tamil Nadu government tool, so Tamil is the home locale, and a
 * device only overrides it when it explicitly prefers English.
 */
export function detectLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const tags = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0].toLowerCase());

  for (const tag of tags) {
    if (tag.startsWith("ta")) return "ta";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}

/** Server-side read of the active locale: explicit cookie choice, else device default. */
export async function getLocale(): Promise<Locale> {
  const cookieValue = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  if (cookieValue === "ta" || cookieValue === "en") return cookieValue;

  const acceptLanguage = (await headers()).get("accept-language");
  return detectLocaleFromAcceptLanguage(acceptLanguage);
}
