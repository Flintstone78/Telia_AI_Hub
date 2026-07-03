import type { Node } from "@/lib/types";

/**
 * Mina verktyg och idéer — noderna i partikelhjärnan.
 *
 * Lägg till en ny nod genom att lägga till ett objekt i listan:
 *   - status: "live" (byggt & används), "beta" (byggt, testas), "idea" (framtida)
 *   - url: länk till verktyget ("#" tills det finns en riktig länk)
 *   - connections: id:n på relaterade noder (ritas som linjer i grafen)
 */
export const nodes: Node[] = [
  {
    id: "image-studio",
    name: "Image Studio",
    description:
      "Bildgenerering och bildbearbetning med AI. Skapa, variera och anpassa bilder för kampanjer och presentationer.",
    status: "live",
    url: "#",
    tags: ["Bild", "Generering"],
    updatedAt: "2026-06-20",
    connections: ["cd-agenten", "brief-agenten"],
  },
  {
    id: "cd-agenten",
    name: "CD-agenten",
    description:
      "Agent som vaktar den visuella identiteten — granskar material mot riktlinjerna för färg, typografi och ton.",
    status: "live",
    url: "#",
    tags: ["Varumärke", "Agent"],
    updatedAt: "2026-06-25",
    connections: ["image-studio", "brief-agenten"],
  },
  {
    id: "disc-profilering",
    name: "DISC-profilering",
    description:
      "Analyserar text och kommunikationsstil utifrån DISC-modellen och föreslår hur budskap kan anpassas per profil.",
    status: "live",
    url: "#",
    tags: ["Analys", "Kommunikation"],
    updatedAt: "2026-06-12",
    connections: ["analys-agenten"],
  },
  {
    id: "brief-agenten",
    name: "Brief-agenten",
    description:
      "Idé: agent som tar emot en rå brief och strukturerar den — mål, målgrupp, kanaler, leverabler — redo att jobba vidare på.",
    status: "idea",
    tags: ["Agent", "Idé"],
    connections: ["cd-agenten", "image-studio"],
  },
  {
    id: "analys-agenten",
    name: "Analys-agenten",
    description:
      "Idé: agent som läser in data och rapporter och sammanfattar insikter, trender och avvikelser på svenska.",
    status: "idea",
    tags: ["Analys", "Idé"],
    connections: ["disc-profilering"],
  },
];
