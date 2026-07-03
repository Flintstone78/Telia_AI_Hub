import type { NodeStatus } from "@/lib/types";

const STYLES: Record<NodeStatus, { label: string; cls: string; dot: string }> = {
  live: { label: "Live", cls: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20", dot: "bg-emerald-400" },
  beta: { label: "Beta", cls: "bg-amber-400/10 text-amber-300 border-amber-400/20", dot: "bg-amber-400" },
  idea: { label: "Idé", cls: "bg-purple-400/10 text-purple-200 border-purple-400/20", dot: "bg-purple-400" },
};

export function statusDotClass(status: NodeStatus) {
  return STYLES[status].dot;
}

export function statusLabel(status: NodeStatus) {
  return STYLES[status].label;
}

export default function StatusBadge({ status }: { status: NodeStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${s.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
