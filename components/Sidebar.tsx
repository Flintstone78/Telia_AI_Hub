"use client";

import type { Node } from "@/lib/types";
import { statusDotClass, statusLabel } from "./StatusBadge";

type Props = {
  nodes: Node[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpenAdd: () => void;
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ nodes, selectedId, onSelect, onOpenAdd, open, onClose }: Props) {
  const tools = nodes.filter((n) => n.status !== "idea");
  const ideas = nodes.filter((n) => n.status === "idea");

  const item = (n: Node) => (
    <button
      key={n.id}
      onClick={() => {
        onSelect(n.id);
        onClose();
      }}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        selectedId === n.id
          ? "bg-purple-500/15 text-purple-50"
          : "text-purple-100/70 hover:bg-white/5 hover:text-purple-50"
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(n.status)}`} />
      <span className="flex-1 truncate">{n.name}</span>
      <span className="text-[10px] uppercase tracking-wide text-purple-100/40">
        {statusLabel(n.status)}
      </span>
    </button>
  );

  return (
    <>
      {/* Mobil-overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/[0.06] bg-ink-950/95 p-4 backdrop-blur transition-transform lg:static lg:z-auto lg:translate-x-0 lg:bg-transparent ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          {/* Logotyp: glödande sfär */}
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full bg-purple-500 blur-md opacity-60" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-300 via-purple-500 to-purple-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 13c4-3 12-3 16-1M5 16c4-2.5 10-2.5 14-1" />
              </svg>
            </div>
          </div>
          <div>
            <div className="font-heading text-lg leading-tight text-white">NAVET</div>
            <div className="text-[11px] text-purple-100/50">Min AI-hubb</div>
          </div>
        </div>

        <nav className="space-y-6">
          <div>
            <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-purple-100/40">
              Verktyg
            </div>
            <div className="space-y-0.5">{tools.map(item)}</div>
            {ideas.length > 0 && (
              <>
                <div className="mb-2 mt-4 px-3 text-[11px] font-medium uppercase tracking-wider text-purple-100/40">
                  Idéer
                </div>
                <div className="space-y-0.5">{ideas.map(item)}</div>
              </>
            )}
          </div>

          <div>
            <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-purple-100/40">
              Inställningar
            </div>
            <button
              onClick={() => {
                onOpenAdd();
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-purple-100/70 transition-colors hover:bg-white/5 hover:text-purple-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Lägg till innehåll
            </button>
            <a
              href="https://github.com/Flintstone78/Telia_AI_Hub"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-purple-100/70 transition-colors hover:bg-white/5 hover:text-purple-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
              </svg>
              Källkod
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
}
