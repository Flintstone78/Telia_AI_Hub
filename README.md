# NAVET — Min AI-hubb

Personlig hubb för mina AI-verktyg: byggda, i beta och på idéstadiet.
Single-user, ingen auth, ingen databas — allt innehåll ligger i statiska
TS-filer och deployas som en vanlig Next.js-app.

Hjärtat är **partikelhjärnan**: en interaktiv nod-graf (canvas 2D + d3-force)
där varje nod är ett verktyg eller en idé. Hovra för tooltip, klicka för
detaljpanel, dra för att panorera, nyp/scrolla för att zooma.

## Kom igång

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

## Lägga till en ny nod (verktyg eller idé)

Öppna `data/tools.ts` och lägg till ett objekt i `nodes`-listan:

```ts
{
  id: "mitt-verktyg",            // unikt, kebab-case
  name: "Mitt verktyg",
  description: "Vad verktyget gör.",
  status: "beta",                // "live" | "beta" | "idea"
  url: "#",                      // riktig länk när den finns
  tags: ["Agent"],
  updatedAt: "2026-07-03",       // ISO-datum → "Uppdaterad: X dagar sedan"
  connections: ["image-studio"], // id:n på relaterade noder → linjer i grafen
},
```

- `status` styr nodens storlek och glöd i grafen: `live` starkast, `idea` svagast.
- `url: "#"` (eller utelämnad) betyder "ingen länk ännu" — kortet i
  Snabbåtkomst markerar då noden i grafen i stället för att navigera.
- Idé-noder (`status: "idea"`) visas inte i Snabbåtkomst och får ingen
  Öppna-knapp i detaljpanelen.

Statistik-raden räknas automatiskt från listan — inga siffror att uppdatera
för hand.

## Lägga till en pipeline-post

Öppna `data/pipeline.ts` och lägg till ett objekt i `pipeline`-listan:

```ts
{
  date: "2026-08-15",        // ISO-datum, listan sorteras på datum
  title: "Ny leverans",
  description: "Valfri beskrivning.",
  tag: "Nytt verktyg",       // styr färgen på den vertikala baren
},
```

Färgerna per tagg definieras i `TAG_COLORS` i `components/Pipeline.tsx` —
okända taggar får en standardfärg.

## Deploy till Vercel

Repot är deploy-klart som det är:

1. Importera repot på [vercel.com/new](https://vercel.com/new)
2. Vercel känner igen Next.js automatiskt — inga inställningar behövs
3. Deploy

Eller via CLI: `npx vercel`.

## Struktur

```
app/            Layout, sida, global CSS (mörkt tema + Telia-glöd)
components/     BrainGraph (partikelhjärnan), Sidebar, TopBar, StatsRow,
                NodeDetail, Pipeline, QuickAccess, AddContentModal
data/           tools.ts + pipeline.ts — ALLT innehåll bor här
lib/            types.ts — datamodellen (Node, PipelineItem)
public/fonts/   TeliaSans + TeliaSansHeading (woff)
```

## Design

- Färger: Telias Purpur-tokens (Core Purple `#990AE3`, Deep Purple `#29003E`,
  Light Purple `#F4E0FF`), porterade från `telia_workspace_all4.html` till
  `tailwind.config.ts`
- Mörk botten med lila glöd, typografi och luft från den ljusare
  referensdesignen
- Typsnitt: TeliaSans / TeliaSansHeading, laddade lokalt via `next/font`
