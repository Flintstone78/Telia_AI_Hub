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
      <p className="mt-0.5 text-xs text-purple-100/55">Kommande leveranser & idékö</p>

      {merged.length === 0 ? (
        <p className="mt-4 text-sm text-purple-100/55">Inget planerat ännu — skriv in en idé nedan.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {merged.map((item) => (
            <li key={item.id ?? `${item.date}-${item.title}`} className="group flex gap-3">
              <div className="w-11 shrink-0 pt-0.5 text-right text-xs font-medium tabular-nums text-purple-100/55">
                {formatDate(item.date)}
              </div>
              <div
                className="w-[3px] shrink-0 rounded-full"
                style={{ backgroundColor: TAG_COLORS[item.tag] ?? DEFAULT_COLOR }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-purple-50">{item.title}</div>
                {item.description && (
                  <div className="mt-0.5 text-xs leading-relaxed text-purple-100/55">
                    {item.description}
                  </div>
                )}
                <span className="chip mt-1.5">
                  {item.tag}
                </span>
              </div>
              {item.id && (
                <button
                  onClick={() => onRemove(item.id!)}
                  title="Ta bort från idékön"
                  aria-label={`Ta bort ${item.title}`}
                  className="pressable self-start rounded-md p-1 text-purple-100/45 hover:bg-white/5 hover:text-purple-100 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0"
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
            className="field h-9 min-w-0 flex-1 px-4"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            aria-label="Lägg till idé"
            className="btn btn-icon btn-primary"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-purple-100/45">
          Idéer sparas lokalt i din webbläsare tills de blir riktiga poster.
        </p>
      </div>
    </div>
  );
}
