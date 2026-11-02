// Deliberately has no @prisma/client (or dictionary.ts) import — this is used
// from the client component action panel, and bundling server-targeted code
// into the browser would be wasteful (and fragile, since Prisma targets
// Node.js). Labels are passed in as plain strings from the server-rendered
// parent instead.
export function AiSourceBadge({
  source,
  labels,
}: {
  source: "nim" | "offline";
  labels: { live: string; offline: string };
}) {
  const className =
    source === "nim" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600";
  const label = source === "nim" ? labels.live : labels.offline;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
