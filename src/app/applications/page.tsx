import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { AppHeader } from "@/components/AppHeader";
import { CategoryBadge, StageBadge, StatusBadge } from "@/components/badges";
import type { Locale } from "@/lib/i18n/types";

function formatDate(d: Date, locale: Locale): string {
  return d.toLocaleDateString(locale === "ta" ? "ta-IN" : "en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AllApplicationsPage() {
  const session = await requireSession();
  const locale = await getLocale();
  const t = getDictionary(locale);

  const applications = await db.application.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">{t.applicationsList.heading}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.applicationsList.subheading}</p>

        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {applications.map((app) => (
            <li key={app.id}>
              <Link
                href={`/applications/${app.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 hover:bg-slate-50"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {app.applicantName} <span className="text-sm text-slate-500">{t.applicationsList.ageLabel(app.age)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <CategoryBadge category={app.category} locale={locale} />
                    <StageBadge stage={app.stage} locale={locale} />
                    <StatusBadge status={app.status} locale={locale} />
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div>{t.applicationsList.lastUpdated}</div>
                  <div>{formatDate(app.updatedAt, locale)}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
