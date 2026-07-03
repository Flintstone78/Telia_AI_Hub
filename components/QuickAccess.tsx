"use client";

import type { Node } from "@/lib/types";
import { statusLabel } from "./StatusBadge";

type Props = {
  nodes: Node[];
  onSelect: (id: string) => void;
};

export default function QuickAccess({ nodes, onSelect }: Props) {
  const tools = nodes.filter((n) => n.status !== "idea");

  return (
    <div className="card px-5 py-4">
      <h2 className="font-heading text-lg text-white">Snabbåtkomst</h2>
      <p className="mt-0.5 text-xs text-purple-100/50">Mina byggda verktyg</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {tools.map((n) => (
          <a
            key={n.id}
            href={n.url ?? "#"}
            target={n.url?.startsWith("http") ? "_blank" : undefined}
            rel={n.url?.startsWith("http") ? "noreferrer" : undefined}
            onClick={(e) => {
              // "#" = ingen riktig länk ännu → markera i grafen i stället
              if (!n.url || n.url === "#") {
                e.preventDefault();
                onSelect(n.id);
              }
            }}
            className="card-hover group rounded-lg border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-purple-500/30 to-purple-700/30 text-sm font-bold text-purple-200 transition-colors group-hover:from-purple-500/50 group-hover:to-purple-700/50">
              {n.name.charAt(0)}
            </div>
            <div className="mt-2.5 truncate text-sm font-medium text-purple-50">{n.name}</div>
            <div className="text-[11px] text-purple-100/40">
              {statusLabel(n.status)}
              {n.tags?.[0] ? ` · ${n.tags[0]}` : ""}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
