import { Category, Stage, Status } from "@prisma/client";
import { CATEGORY_LABELS, STAGE_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { UrgencyResult } from "@/lib/workflow";

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  const color =
    category === Category.old_age ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800";
  return <Badge className={color}>{CATEGORY_LABELS[category]}</Badge>;
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <Badge className="bg-slate-100 text-slate-700">{STAGE_LABELS[stage]}</Badge>;
}

export function StatusBadge({ status }: { status: Status }) {
  const color =
    status === Status.approved
      ? "bg-green-100 text-green-800"
      : status === Status.rejected
        ? "bg-red-100 text-red-800"
        : status === Status.returned
          ? "bg-orange-100 text-orange-800"
          : "bg-blue-100 text-blue-800";
  return <Badge className={color}>{STATUS_LABELS[status]}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyResult }) {
  if (urgency.level === "urgent") {
    return <Badge className="bg-red-600 text-white">அவசரம்</Badge>;
  }
  if (urgency.level === "attention") {
    return <Badge className="bg-yellow-400 text-yellow-900">கவனம் தேவை</Badge>;
  }
  return <Badge className="bg-slate-100 text-slate-500">இயல்பு</Badge>;
}
