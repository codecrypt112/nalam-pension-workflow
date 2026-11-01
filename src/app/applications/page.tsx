import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { CategoryBadge, StageBadge, StatusBadge } from "@/components/badges";

function formatDate(d: Date): string {
  return d.toLocaleDateString("ta-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AllApplicationsPage() {
  const session = await requireSession();

  const applications = await db.application.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">அனைத்து விண்ணப்பங்கள்</h1>
        <p className="mt-1 text-sm text-slate-500">
          தற்போதைய நிலை மற்றும் முழு வரலாற்றைக் காண — அனைத்து பணிப்பாய்வு நிலைகளிலும் உள்ள விண்ணப்பங்கள்.
        </p>

        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {applications.map((app) => (
            <li key={app.id}>
              <Link
                href={`/applications/${app.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 hover:bg-slate-50"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {app.applicantName} <span className="text-sm text-slate-500">(வயது {app.age})</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <CategoryBadge category={app.category} />
                    <StageBadge stage={app.stage} />
                    <StatusBadge status={app.status} />
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div>கடைசி புதுப்பிப்பு</div>
                  <div>{formatDate(app.updatedAt)}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
