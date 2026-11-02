"use client";

import { usePathname } from "next/navigation";
import { setLocaleAction } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/types";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <form action={setLocaleAction} className="flex items-center gap-1.5 text-xs">
      <input type="hidden" name="redirectTo" value={pathname} />
      <button
        type="submit"
        name="locale"
        value="ta"
        aria-current={locale === "ta"}
        className={locale === "ta" ? "font-semibold text-slate-900 underline" : "text-slate-400 hover:text-slate-600"}
      >
        தமிழ்
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="submit"
        name="locale"
        value="en"
        aria-current={locale === "en"}
        className={locale === "en" ? "font-semibold text-slate-900 underline" : "text-slate-400 hover:text-slate-600"}
      >
        English
      </button>
    </form>
  );
}
