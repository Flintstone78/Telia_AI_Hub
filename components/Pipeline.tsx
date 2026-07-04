"use client";

import { useState } from "react";
import type { PipelineItem } from "@/lib/types";
import type { LocalIdea } from "@/lib/useLocalIdeas";

/** Färg på den vertikala baren per tagg — okända taggar får standardfärgen. */
const TAG_COLORS: Record<string, string> = {
  "Nytt verktyg": "#990AE3",
  Underhåll: "#38BDF8",
  Idé: "#F59E0B",
  Idékö: "#2DD4BF",
};
const DEFAULT_COLOR = "#B44FEA";

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

type Props = {
  items: PipelineItem[];
  localIdeas: LocalIdea[];
  onAdd: (title: string) => void;
  onRemove: (id: string) => void;
};

export default function Pipeline({ items, localIdeas, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState("");

  const merged: Array<PipelineItem & { id?: string }> = [...items, ...localIdeas].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const submit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };

  return (
    <div className="card px-5 py-4">
      <h2 className="font-heading text-lg text-white">Pipeline</h2>
      <p className="mt-0.5 text-xs text-purple-100/50">Kommande leveranser & idékö</p>

      {merged.length === 0 ? (
        <p className="mt-4 text-sm text-purple-100/50">Inget planerat ännu — skriv in en idé nedan.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {merged.map((item) => (
            <li key={item.id ?? `${item.date}-${item.title}`} className="group flex gap-3">
              <div className="w-11 shrink-0 pt-0.5 text-right text-xs font-medium text-purple-100/50">
                {formatDate(item.date)}
              </div>
              <div
                className="w-[3px] shrink-0 rounded-full"
                style={{ backgroundColor: TAG_COLORS[item.tag] ?? DEFAULT_COLOR }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-purple-50">{item.title}</div>
                {item.description && (
                  <div className="mt-0.5 text-xs leading-relaxed text-purple-100/50">
                    {item.description}
                  </div>
                )}
                <span className="mt-1.5 inline-block rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-purple-100/60">
                  {item.tag}
                </span>
              </div>
              {item.id && (
                <button
                  onClick={() => onRemove(item.id!)}
                  title="Ta bort från idékön"
                  aria-label={`Ta bort ${item.title}`}
                  className="self-start rounded-md p-1 text-purple-100/30 opacity-0 transition-opacity hover:bg-white/5 hover:text-purple-100 group-hover:opacity-100"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Lägg till i idékön */}
      <div className="mt-4 border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Lägg till idé i kön…"
            className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-purple-50 placeholder:text-purple-100/40 outline-none transition-colors focus:border-purple-400/50"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            aria-label="Lägg till idé"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white transition-colors hover:bg-purple-600 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-purple-100/35">
          Idéer sparas lokalt i din webbläsare tills de blir riktiga poster.
        </p>
      </div>
    </div>
  );
}
