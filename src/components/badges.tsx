import { Category, Stage, Status } from "@prisma/client";
import { categoryLabel, stageLabel, statusLabel } from "@/lib/labels";
import type { UrgencyResult } from "@/lib/workflow";
import type { Locale } from "@/lib/i18n/types";
import type { Dictionary } from "@/lib/i18n/dictionary";

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

export function CategoryBadge({ category, locale }: { category: Category; locale: Locale }) {
  const color =
    category === Category.old_age ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800";
  return <Badge className={color}>{categoryLabel(category, locale)}</Badge>;
}

export function StageBadge({ stage, locale }: { stage: Stage; locale: Locale }) {
  return <Badge className="bg-slate-100 text-slate-700">{stageLabel(stage, locale)}</Badge>;
}

export function StatusBadge({ status, locale }: { status: Status; locale: Locale }) {
  const color =
    status === Status.approved
      ? "bg-green-100 text-green-800"
      : status === Status.rejected
        ? "bg-red-100 text-red-800"
        : status === Status.returned
          ? "bg-orange-100 text-orange-800"
          : "bg-blue-100 text-blue-800";
  return <Badge className={color}>{statusLabel(status, locale)}</Badge>;
}

export function UrgencyBadge({
  urgency,
  labels,
}: {
  urgency: UrgencyResult;
  labels: Dictionary["urgency"];
}) {
  if (urgency.level === "urgent") {
    return <Badge className="bg-red-600 text-white">{labels.urgent}</Badge>;
  }
  if (urgency.level === "attention") {
    return <Badge className="bg-yellow-400 text-yellow-900">{labels.attention}</Badge>;
  }
  return <Badge className="bg-slate-100 text-slate-500">{labels.normal}</Badge>;
}
