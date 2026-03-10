import { formatStatusLabel } from "@/lib/constants";

type StatusPillProps = {
  status: string;
};

const statusClassMap: Record<string, string> = {
  DRAFT: "bg-slate-500/20 text-slate-200 border-slate-400/40",
  PENDING_APPROVAL: "bg-amber-500/20 text-amber-200 border-amber-400/40",
  APPROVED: "bg-blue-500/20 text-blue-100 border-blue-400/40",
  SCHEDULED: "bg-indigo-500/20 text-indigo-100 border-indigo-400/40",
  PUBLISHING: "bg-cyan-500/20 text-cyan-100 border-cyan-400/40",
  PUBLISHED: "bg-emerald-500/20 text-emerald-100 border-emerald-400/40",
  FAILED: "bg-rose-500/20 text-rose-100 border-rose-400/40",
  REJECTED: "bg-red-500/20 text-red-100 border-red-400/40",
  ACTIVE: "bg-emerald-500/20 text-emerald-100 border-emerald-400/40",
  EXPIRED: "bg-amber-500/20 text-amber-100 border-amber-400/40",
  DISCONNECTED: "bg-slate-500/20 text-slate-100 border-slate-400/40",
};

export function StatusPill({ status }: StatusPillProps) {
  const className =
    statusClassMap[status] ?? "bg-slate-500/20 text-slate-100 border-slate-400/40";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {formatStatusLabel(status)}
    </span>
  );
}
