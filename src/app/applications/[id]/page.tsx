import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { availableActions, canUserActOnApplication, checkEligibility, formatEligibilityReason } from "@/lib/workflow";
import { actionLabel, categoryLabel, roleLabel, stageLabel } from "@/lib/labels";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { translateGender } from "@/lib/i18n/dictionary";
import { AppHeader } from "@/components/AppHeader";
import { CategoryBadge, StageBadge, StatusBadge } from "@/components/badges";
import { ApplicationActionPanel } from "./ApplicationActionPanel";
import type { Locale } from "@/lib/i18n/types";

function formatDateTime(d: Date, locale: Locale): string {
  return d.toLocaleString(locale === "ta" ? "ta-IN" : "en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ApplicationDetailPage({
  params,
}: PageProps<"/applications/[id]">) {
  const { id } = await params;
  const session = await requireSession();
  const locale = await getLocale();
  const t = getDictionary(locale);

  const app = await db.application.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: true },
      },
    },
  });

  if (!app) notFound();

  const eligibility = checkEligibility(app);
  const canAct = canUserActOnApplication(session.role, app.stage, app.status);
  const actions = canAct
    ? availableActions(session.role, app.stage, app.status).map((a) => ({
        action: a.action as string,
        label: a.label[locale],
      }))
    : [];

  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">
          {t.applicationDetail.backToQueue}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{app.applicantName}</h1>
            <p className="text-sm text-slate-500">
              {t.applicationDetail.ageGender(app.age, translateGender(app.gender, locale))}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CategoryBadge category={app.category} locale={locale} />
            <StageBadge stage={app.stage} locale={locale} />
            <StatusBadge status={app.status} locale={locale} />
          </div>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">{t.applicationDetail.detailsHeading}</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">{t.applicationDetail.address}</dt>
              <dd className="text-slate-900">{app.address}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t.applicationDetail.aadhaar}</dt>
              <dd className="text-slate-900">{app.aadhaarNo}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t.applicationDetail.bankAccount}</dt>
              <dd className="text-slate-900">{app.bankAccount}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t.applicationDetail.monthlyIncome}</dt>
              <dd className="text-slate-900">₹{app.monthlyIncome}</dd>
            </div>
            {app.category === "widow" && (
              <>
                <div>
                  <dt className="text-slate-500">{t.applicationDetail.spouseDeceasedConfirmed}</dt>
                  <dd className="text-slate-900">{app.spouseDeceased ? t.common.yes : t.common.no}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{t.applicationDetail.remarried}</dt>
                  <dd className="text-slate-900">{app.remarried ? t.common.yes : t.common.no}</dd>
                </div>
              </>
            )}
          </dl>
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">{t.applicationDetail.eligibilityHeading}</h2>
          {eligibility.eligible ? (
            <p className="mt-2 text-sm text-green-700">
              {t.applicationDetail.eligibleMessage(categoryLabel(app.category, locale))}
            </p>
          ) : (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
              {eligibility.reasons.map((reason, i) => (
                <li key={i}>{formatEligibilityReason(reason, locale)}</li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6">
          {canAct ? (
            <ApplicationActionPanel
              applicationId={app.id}
              stage={app.stage as "stage1" | "stage2" | "stage3"}
              availableActions={actions}
              t={t.actionPanel}
              aiSourceLabels={t.aiSource}
            />
          ) : (
            <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              {app.status === "approved" || app.status === "rejected"
                ? t.applicationDetail.closedMessage(stageLabel(app.stage, locale))
                : t.applicationDetail.notYourQueueMessage(stageLabel(app.stage, locale))}
            </section>
          )}
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">{t.applicationDetail.historyHeading}</h2>
          {app.events.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t.applicationDetail.noHistory}</p>
          ) : (
            <ol className="mt-3 space-y-4">
              {app.events.map((event) => (
                <li key={event.id} className="border-l-2 border-slate-200 pl-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-slate-900">{stageLabel(event.stage, locale)}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700">{actionLabel(event.action, locale)}</span>
                    {event.aiAssisted && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        {event.aiEdited ? t.applicationDetail.aiAssistedEdited : t.applicationDetail.aiAssistedUnedited}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{event.remarks}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.actor.name} ({roleLabel(event.actor.role, locale)}) · {formatDateTime(event.createdAt, locale)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </>
  );
}
