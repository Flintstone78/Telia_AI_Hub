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
    url: "https://telia-image-studio.vercel.app/",
    tags: ["Bild", "Generering"],
    updatedAt: "2026-06-20",
    connections: ["cd-agenten", "brief-generator"],
  },
  {
    id: "cd-agenten",
    name: "CD-agenten",
    description:
      "Agent som vaktar den visuella identiteten — granskar material mot riktlinjerna för färg, typografi och ton.",
    status: "live",
    url: "https://cd-agenten.vercel.app",
    tags: ["Varumärke", "Agent"],
    updatedAt: "2026-06-25",
    connections: ["image-studio", "brief-generator"],
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
    connections: ["dataanalys-agenten"],
  },
  {
    id: "brief-generator",
    name: "Brief Generator",
    description:
      "Agent som tar emot en rå brief och strukturerar den — mål, målgrupp, kanaler, leverabler. Byggs som en del av NAVET och bor på /brief.",
    status: "idea",
    url: "/brief",
    tags: ["Agent", "Idé"],
    connections: ["cd-agenten", "image-studio"],
  },
  {
    id: "dataanalys-agenten",
    name: "Dataanalys-agenten",
    description:
      "Idé: agent som läser in data och rapporter och sammanfattar insikter, trender och avvikelser på svenska.",
    status: "idea",
    tags: ["Analys", "Idé"],
    connections: ["disc-profilering", "research-agenten", "cx-agenten"],
  },
  {
    id: "research-agenten",
    name: "Research-agenten",
    description:
      "Idé: agent som gör research på egen hand — samlar källor, sammanfattar läget och levererar ett underlag att agera på.",
    status: "idea",
    tags: ["Research", "Idé"],
    connections: ["dataanalys-agenten", "brief-generator"],
  },
  {
    id: "campaign-agenten",
    name: "Telia Campaign-agenten",
    description:
      "Idé: agent för Telia-kampanjer — från brief till kampanjidéer, budskap och material, med varumärket inbyggt.",
    status: "idea",
    tags: ["Kampanj", "Idé"],
    connections: ["brief-generator", "image-studio", "cd-agenten"],
  },
  {
    id: "cx-agenten",
    name: "Customer Experience-agenten",
    description:
      "Idé: agent som samlar vad vi vet om våra kunder — insikter, beteenden och behov — och gör det användbart i varje läge.",
    status: "idea",
    tags: ["Kundinsikt", "Idé"],
    connections: ["dataanalys-agenten", "disc-profilering"],
  },
];
