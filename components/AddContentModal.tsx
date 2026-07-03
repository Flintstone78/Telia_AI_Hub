"use client";

import { useEffect } from "react";

const NODE_SNIPPET = `// data/tools.ts
{
  id: "mitt-verktyg",
  name: "Mitt verktyg",
  description: "Vad verktyget gör.",
  status: "beta", // "live" | "beta" | "idea"
  url: "#",
  tags: ["Agent"],
  updatedAt: "2026-07-03",
  connections: ["image-studio"],
},`;

const PIPELINE_SNIPPET = `// data/pipeline.ts
{
  date: "2026-08-15",
  title: "Ny leverans",
  description: "Valfri beskrivning.",
  tag: "Nytt verktyg",
},`;

type Props = { open: boolean; onClose: () => void };

export default function AddContentModal({ open, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card max-h-[85vh] w-full max-w-lg overflow-y-auto border-purple-400/20 bg-ink-900/95 px-6 py-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl text-white">Lägg till innehåll</h2>
            <p className="mt-1 text-sm text-purple-100/60">
              All data ligger i statiska TS-filer — inget API, ingen databas. Redigera,
              committa och deploya.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="rounded-md p-1.5 text-purple-100/60 hover:bg-white/5 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <div className="text-sm font-medium text-purple-50">Ny nod i grafen</div>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-ink-950 p-3 text-[12px] leading-relaxed text-purple-100/80">
              {NODE_SNIPPET}
            </pre>
          </div>
          <div>
            <div className="text-sm font-medium text-purple-50">Ny pipeline-post</div>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-ink-950 p-3 text-[12px] leading-relaxed text-purple-100/80">
              {PIPELINE_SNIPPET}
            </pre>
          </div>
          <p className="text-xs text-purple-100/50">
            Fullständig beskrivning finns i <code className="text-purple-200">README.md</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
