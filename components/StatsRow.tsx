import type { Node, PipelineItem } from "@/lib/types";

type Props = { nodes: Node[]; pipeline: PipelineItem[] };

export default function StatsRow({ nodes, pipeline }: Props) {
  const live = nodes.filter((n) => n.status === "live").length;
  const beta = nodes.filter((n) => n.status === "beta").length;
  const ideas = nodes.filter((n) => n.status === "idea").length;

  const stats = [
    { value: live + beta, label: "Verktyg byggda", sub: beta > 0 ? `${live} live · ${beta} beta` : "status: live" },
    { value: ideas, label: "Idéer", sub: "framtida verktyg" },
    { value: nodes.length, label: "Noder totalt", sub: "i grafen" },
    { value: pipeline.length, label: "I pipeline", sub: "planerade poster" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="card px-4 py-3.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-purple-100/40">
            {s.label}
          </div>
          <div className="mt-1 font-heading text-3xl text-white">{s.value}</div>
          <div className="mt-0.5 text-xs text-purple-100/50">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
