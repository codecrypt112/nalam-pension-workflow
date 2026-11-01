// Deliberately has no @prisma/client import — this is used from the client
// component action panel, and bundling the Prisma client into the browser
// would be wasteful (and fragile, since it targets the Node.js runtime).
export function AiSourceBadge({ source }: { source: "nim" | "offline" }) {
  const className =
    source === "nim" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600";
  const label = source === "nim" ? "AI உதவி" : "AI உதவி — ஆஃப்லைன் பயன்முறை";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
