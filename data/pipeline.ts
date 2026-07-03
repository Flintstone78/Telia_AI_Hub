import type { PipelineItem } from "@/lib/types";

/**
 * Pipeline — kommande leveranser och milstolpar.
 *
 * Lägg till en post genom att lägga till ett objekt i listan.
 * `tag` styr färgen på den vertikala baren (se TAG_COLORS i
 * components/Pipeline.tsx — okända taggar får en standardfärg).
 */
export const pipeline: PipelineItem[] = [
  {
    date: "2026-07-15",
    title: "Riktiga länkar till verktygen",
    description: "Byt ut '#' mot skarpa URL:er för Image Studio, CD-agenten och DISC.",
    tag: "Underhåll",
  },
  {
    date: "2026-08-01",
    title: "Brief-agenten — första utkast",
    description: "Från idé till första körbara prototyp.",
    tag: "Nytt verktyg",
  },
  {
    date: "2026-09-01",
    title: "Analys-agenten — konceptskiss",
    description: "Definiera datakällor och första användningsfall.",
    tag: "Idé",
  },
];
