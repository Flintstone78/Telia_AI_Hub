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
    title: "Riktig länk till DISC-profilering",
    description: "Byt ut '#' mot skarp URL. Image Studio och CD-agenten är klara.",
    tag: "Underhåll",
  },
  {
    date: "2026-08-01",
    title: "Brief Generator — första utkast",
    description: "Byggs inom NAVET-repot, bor på /brief.",
    tag: "Nytt verktyg",
  },
  {
    date: "2026-09-01",
    title: "Dataanalys-agenten — konceptskiss",
    description: "Definiera datakällor och första användningsfall.",
    tag: "Idé",
  },
];
