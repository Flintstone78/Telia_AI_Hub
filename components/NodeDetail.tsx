"use client";

import type { Node } from "@/lib/types";
import StatusBadge from "./StatusBadge";

function daysAgo(iso?: string): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
  if (days === 0) return "idag";
  if (days === 1) return "1 dag sedan";
  return `${days} dagar sedan`;
}

type Props = {
  node: Node | null;
  allNodes: Node[];
  onSelect: (id: string) => void;
};

/** Liten SVG-minigraf över den valda nodens kopplingar */
function RelatedMiniGraph({ node, allNodes, onSelect }: Props & { node: Node }) {
  const related = (node.connections ?? [])
    .map((id) => allNodes.find((n) => n.id === id))
    .filter((n): n is Node => Boolean(n));

  if (related.length === 0) {
    return <p className="text-xs text-purple-100/40">Inga kopplingar ännu.</p>;
  }

  const W = 240;
  const H = 150;
  const cx = W / 2;
  const cy = H / 2;
  const R = 52;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
      {related.map((r, i) => {
        const a = (i / related.length) * Math.PI * 2 - Math.PI / 2 + 0.5;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R * 0.75;
        return (
          <g key={r.id} className="cursor-pointer" onClick={() => onSelect(r.id)}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(180,79,234,0.35)" strokeWidth="1" />
            <circle cx={x} cy={y} r="5" fill="#B44FEA" opacity={r.status === "idea" ? 0.5 : 0.95} />
            <circle cx={x} cy={y} r="9" fill="#990AE3" opacity="0.15" />
            <text
              x={x}
              y={y + 18}
              textAnchor="middle"
              className="fill-purple-100/70 text-[9px]"
            >
              {r.name}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="10" fill="url(#hubGrad)" />
      <defs>
        <radialGradient id="hubGrad">
          <stop offset="0%" stopColor="#CC88F0" />
          <stop offset="100%" stopColor="#7300AD" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r="16" fill="#990AE3" opacity="0.2" />
    </svg>
  );
}

export default function NodeDetail({ node, allNodes, onSelect }: Props) {
  if (!node) {
    return (
      <div className="card flex items-center justify-center px-6 py-8 text-sm text-purple-100/50">
        Välj en nod i grafen för att se detaljer.
      </div>
    );
  }

  const updated = daysAgo(node.updatedAt);

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
      <div className="card px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-heading text-xl text-white">{node.name}</h3>
          <StatusBadge status={node.status} />
          {node.tags?.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-purple-100/60"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-purple-100/70">
          {node.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {updated && (
            <span className="flex items-center gap-1.5 text-xs text-purple-100/50">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              Uppdaterad: {updated}
            </span>
          )}
          {node.url && node.status !== "idea" && (
            <a
              href={node.url}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-purple-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-600"
            >
              Öppna
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          )}
        </div>
      </div>

      <div className="card px-4 py-3">
        <div className="text-[11px] font-medium uppercase tracking-wider text-purple-100/40">
          Relaterade noder
        </div>
        <div className="mt-1 h-[140px]">
          <RelatedMiniGraph node={node} allNodes={allNodes} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
