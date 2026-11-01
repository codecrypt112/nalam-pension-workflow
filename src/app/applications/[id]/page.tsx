import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { availableActions, canUserActOnApplication, checkEligibility } from "@/lib/workflow";
import { ACTION_LABELS, CATEGORY_LABELS, ROLE_LABELS, STAGE_LABELS } from "@/lib/labels";
import { AppHeader } from "@/components/AppHeader";
import { CategoryBadge, StageBadge, StatusBadge } from "@/components/badges";
import { ApplicationActionPanel } from "./ApplicationActionPanel";

function formatDateTime(d: Date): string {
  return d.toLocaleString("ta-IN", {
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
        label: a.label,
      }))
    : [];

  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">
          ← பணிப்பட்டியலுக்குத் திரும்பு
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{app.applicantName}</h1>
            <p className="text-sm text-slate-500">வயது {app.age} · {app.gender}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CategoryBadge category={app.category} />
            <StageBadge stage={app.stage} />
            <StatusBadge status={app.status} />
          </div>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">விண்ணப்ப விவரங்கள்</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">முகவரி</dt>
              <dd className="text-slate-900">{app.address}</dd>
            </div>
            <div>
              <dt className="text-slate-500">ஆதார் எண்</dt>
              <dd className="text-slate-900">{app.aadhaarNo}</dd>
            </div>
            <div>
              <dt className="text-slate-500">வங்கி கணக்கு</dt>
              <dd className="text-slate-900">{app.bankAccount}</dd>
            </div>
            <div>
              <dt className="text-slate-500">மாத வருமானம்</dt>
              <dd className="text-slate-900">ரூ.{app.monthlyIncome}</dd>
            </div>
            {app.category === "widow" && (
              <>
                <div>
                  <dt className="text-slate-500">கணவர் இறப்பு உறுதி</dt>
                  <dd className="text-slate-900">{app.spouseDeceased ? "ஆம்" : "இல்லை"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">மீண்டும் திருமணம்</dt>
                  <dd className="text-slate-900">{app.remarried ? "ஆம்" : "இல்லை"}</dd>
                </div>
              </>
            )}
          </dl>
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">தகுதி சரிபார்ப்பு பட்டியல்</h2>
          {eligibility.eligible ? (
            <p className="mt-2 text-sm text-green-700">
              ✓ {CATEGORY_LABELS[app.category]} தகுதி நிபந்தனைகள் அனைத்தும் பூர்த்தி செய்யப்பட்டுள்ளன.
            </p>
          ) : (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
              {eligibility.reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
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
            />
          ) : (
            <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              {app.status === "approved" || app.status === "rejected"
                ? `இந்த விண்ணப்பம் முடிவு செய்யப்பட்டது (${STAGE_LABELS[app.stage]} நிலையில்). மேலும் நடவடிக்கை தேவையில்லை.`
                : `இந்த விண்ணப்பம் தற்போது "${STAGE_LABELS[app.stage]}" நிலையில் உள்ளது — இது உங்கள் பணிப்பட்டியலின் பகுதி அல்ல.`}
            </section>
          )}
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">வரலாறு</h2>
          {app.events.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">இதுவரை எந்த நடவடிக்கையும் பதிவாகவில்லை.</p>
          ) : (
            <ol className="mt-3 space-y-4">
              {app.events.map((event) => (
                <li key={event.id} className="border-l-2 border-slate-200 pl-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-slate-900">{STAGE_LABELS[event.stage]}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700">{ACTION_LABELS[event.action]}</span>
                    {event.aiAssisted && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        AI உதவியுடன் {event.aiEdited ? "(திருத்தப்பட்டது)" : "(மாற்றமில்லாமல்)"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{event.remarks}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.actor.name} ({ROLE_LABELS[event.actor.role]}) · {formatDateTime(event.createdAt)}
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
