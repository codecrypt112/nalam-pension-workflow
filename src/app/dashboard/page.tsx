import Link from "next/link";
import { EventAction, Stage, Status } from "@prisma/client";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { computeUrgency, stagesForRole } from "@/lib/workflow";
import { STAGE_LABELS } from "@/lib/labels";
import { AppHeader } from "@/components/AppHeader";
import { CategoryBadge, StageBadge, UrgencyBadge } from "@/components/badges";

const DAY_MS = 1000 * 60 * 60 * 24;

export default async function DashboardPage() {
  const session = await requireSession();
  const stages = stagesForRole(session.role);

  const myQueueApps = await db.application.findMany({
    where: {
      stage: { in: stages },
      status: { notIn: [Status.approved, Status.rejected] },
    },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const now = new Date();
  const queue = myQueueApps
    .map((app) => ({
      app,
      urgency: computeUrgency(
        {
          status: app.status,
          age: app.age,
          createdAt: app.createdAt,
          lastEventAt: app.events[0]?.createdAt ?? null,
        },
        now
      ),
    }))
    .sort((a, b) => b.urgency.score - a.urgency.score);

  const [stageCounts, totalApplications, returnedCount, approvedWithEvent] = await Promise.all([
    db.application.groupBy({
      by: ["stage"],
      where: { status: { notIn: [Status.approved, Status.rejected] } },
      _count: true,
    }),
    db.application.count(),
    db.application.count({ where: { events: { some: { action: EventAction.return_app } } } }),
    db.application.findMany({
      where: { status: Status.approved },
      select: {
        createdAt: true,
        events: {
          where: { action: EventAction.approve },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ]);

  const decisionDays = approvedWithEvent
    .map((a) => (a.events[0] ? (a.events[0].createdAt.getTime() - a.createdAt.getTime()) / DAY_MS : null))
    .filter((d): d is number => d !== null);
  const avgDaysToDecision =
    decisionDays.length > 0 ? decisionDays.reduce((s, d) => s + d, 0) / decisionDays.length : null;
  const returnedRate = totalApplications > 0 ? (returnedCount / totalApplications) * 100 : 0;

  const stageCountMap = new Map(stageCounts.map((s) => [s.stage, s._count]));

  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">என் பணிப்பட்டியல்</h1>
        <p className="mt-1 text-sm text-slate-500">
          {session.name} — கவனம் தேவையானவை முதலில் காட்டப்படுகின்றன.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.values(Stage).map((stage) => (
            <div key={stage} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">{STAGE_LABELS[stage]}</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {stageCountMap.get(stage) ?? 0}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">சராசரி முடிவு நேரம்</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {avgDaysToDecision !== null ? `${avgDaysToDecision.toFixed(1)} நாட்கள்` : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">திருப்பி அனுப்பப்பட்ட விகிதம்</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{returnedRate.toFixed(0)}%</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">மொத்த விண்ணப்பங்கள்</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{totalApplications}</div>
          </div>
        </div>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">
          நடவடிக்கை தேவையானவை ({queue.length})
        </h2>

        {queue.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
            உங்கள் பணிப்பட்டியலில் தற்போது விண்ணப்பங்கள் இல்லை.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {queue.map(({ app, urgency }) => (
              <li key={app.id}>
                <Link
                  href={`/applications/${app.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {app.applicantName}{" "}
                      <span className="text-sm text-slate-500">(வயது {app.age})</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <CategoryBadge category={app.category} />
                      <StageBadge stage={app.stage} />
                      <UrgencyBadge urgency={urgency} />
                    </div>
                    {urgency.reasons.length > 0 && (
                      <div className="mt-1 text-xs text-slate-500">{urgency.reasons.join(" · ")}</div>
                    )}
                  </div>
                  <span className="text-sm text-blue-700">பார்க்க →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
