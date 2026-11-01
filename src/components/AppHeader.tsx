import Link from "next/link";
import { ROLE_LABELS } from "@/lib/labels";
import { logoutAction } from "@/lib/actions";
import type { SessionPayload } from "@/lib/auth";

export function AppHeader({ session }: { session: SessionPayload }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900">நலம்</span>
          <span className="text-sm text-slate-500">ஓய்வூதியப் பணிப்பாய்வு</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/applications" className="text-slate-600 hover:text-slate-900">
            அனைத்து விண்ணப்பங்கள்
          </Link>
          <div className="text-right">
            <div className="font-medium text-slate-900">{session.name}</div>
            <div className="text-xs text-slate-500">{ROLE_LABELS[session.role]}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              வெளியேறு
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
