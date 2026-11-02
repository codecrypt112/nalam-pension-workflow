import Link from "next/link";
import { roleLabel } from "@/lib/labels";
import { logoutAction } from "@/lib/actions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { SessionPayload } from "@/lib/auth";

export async function AppHeader({ session }: { session: SessionPayload }) {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900">{t.common.appName}</span>
          <span className="text-sm text-slate-500">{t.common.appTagline}</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <LanguageSwitcher locale={locale} />
          <Link href="/applications" className="text-slate-600 hover:text-slate-900">
            {t.nav.allApplications}
          </Link>
          <div className="text-right">
            <div className="font-medium text-slate-900">{session.name}</div>
            <div className="text-xs text-slate-500">{roleLabel(session.role, locale)}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              {t.nav.logout}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
