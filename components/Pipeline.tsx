import type { PipelineItem } from "@/lib/types";

/** Färg på den vertikala baren per tagg — okända taggar får standardfärgen. */
const TAG_COLORS: Record<string, string> = {
  "Nytt verktyg": "#990AE3",
  Underhåll: "#38BDF8",
  Idé: "#F59E0B",
};
const DEFAULT_COLOR = "#B44FEA";

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function Pipeline({ items }: { items: PipelineItem[] }) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="card px-5 py-4">
      <h2 className="font-heading text-lg text-white">Pipeline</h2>
      <p className="mt-0.5 text-xs text-purple-100/50">Kommande leveranser</p>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-purple-100/50">
          Inget planerat just nu. Lägg till poster i <code className="text-purple-200">data/pipeline.ts</code>.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {sorted.map((item) => (
            <li key={`${item.date}-${item.title}`} className="flex gap-3">
              <div className="w-11 shrink-0 pt-0.5 text-right text-xs font-medium text-purple-100/50">
                {formatDate(item.date)}
              </div>
              <div
                className="w-[3px] shrink-0 rounded-full"
                style={{ backgroundColor: TAG_COLORS[item.tag] ?? DEFAULT_COLOR }}
              />
              <div className="min-w-0">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
