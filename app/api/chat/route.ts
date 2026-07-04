import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const maxDuration = 60; // bildgenerering kan ta ~15-30 s

const IMAGE_STUDIO_URL = "https://telia-image-studio.vercel.app";
const CD_AGENTEN_URL = "https://cd-agenten.vercel.app";

type ChatMessage = { role: "user" | "assistant"; text: string };
type GeneratedImage = { url: string; prompt: string };

const SYSTEM_PROMPT = `Du är NAVET — Fredriks personliga AI-hubb som dirigerar hans egna AI-verktyg.

Verktyg som är kopplade just nu:
- Image Studio (verktyget generate_image): bildgenerering med Google Imagen 4.
- CD-agenten (verktygen validate_concept och generate_concepts): Telias Creative Director-agent. validate_concept granskar ett kreativt koncept/copy mot Telias brand guidelines och ger poäng på 5 dimensioner. generate_concepts tar en brief och ger 3 distinkta kreativa konceptspår i Telias ton.

Verktyg som finns men inte är kopplade till chatten ännu: DISC-profilering (kommunikationsanalys). Om Fredrik ber om något den gör — förklara ärligt att den inte är kopplad ännu.

Riktlinjer:
- Svara på svenska, kort och konkret.
- När Fredrik ber om en bild: skriv en genomarbetad engelsk prompt till generate_image (fotorealistisk om inget annat anges, gärna med ljussättning och miljö). Telias färgvärld är lila (#990AE3) när varumärket är relevant.
- Välj aspect ratio utifrån användningen: 16:9 för presentationer/hero, 1:1 för sociala medier, 9:16 för stories.
- Efter en genererad bild: beskriv kort vad du skapade. Bilden visas automatiskt i chatten.
- Efter en validering: presentera totalpoängen, de 5 delpoängen kompakt, och lyft de viktigaste styrkorna/förbättringarna. Var lika rak som CD-agenten.
- Efter genererade koncept: presentera de 3 spåren tydligt med titel, tagline och kärnan i varje.`;

const tools: Anthropic.Tool[] = [
  {
    name: "generate_image",
    description:
      "Genererar en bild via Fredriks Image Studio (Google Imagen 4). Använd när Fredrik ber om en bild, illustration eller visuellt material. Skriv prompten på engelska, detaljerad och konkret.",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Detaljerad engelsk bildprompt: motiv, miljö, ljus, stil.",
        },
        aspectRatio: {
          type: "string",
          enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
          description: "Bildformat. Standard 16:9.",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "validate_concept",
    description:
      "Granskar ett kreativt koncept, copy eller kampanjidé mot Telias brand guidelines via CD-agenten. Returnerar totalpoäng, 5 delpoäng (varumärke, ton, budskap, originalitet, kanal), styrkor och förbättringsförslag. Använd när Fredrik vill ha feedback, granskning eller 'CD-koll' på något.",
    input_schema: {
      type: "object",
      properties: {
        concept: {
          type: "string",
          description:
            "Konceptet/copyn/idén som ska granskas, på svenska. Minst en mening — skicka med all kontext Fredrik gett.",
        },
      },
      required: ["concept"],
    },
  },
  {
    name: "generate_concepts",
    description:
      "Genererar 3 distinkta kreativa konceptspår från en brief via CD-agenten, i Telias ton och varumärke. Använd när Fredrik vill ha kampanjidéer, kreativa spår eller koncept från en brief.",
    input_schema: {
      type: "object",
      properties: {
        brief: {
          type: "string",
          description:
            "Briefen på svenska: produkt/tjänst, mål, målgrupp och annan kontext Fredrik gett.",
        },
      },
      required: ["brief"],
    },
  },
];

async function callCdAgenten(path: string, body: object) {
  const res = await fetch(`${CD_AGENTEN_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || `CD-agenten svarade ${res.status}`);
  return data;
}

async function generateImage(prompt: string, aspectRatio = "16:9") {
  const res = await fetch(`${IMAGE_STUDIO_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUB_API_SECRET}`,
    },
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  const data = await res.json();
  if (!res.ok || !data.imageUrl) {
    throw new Error(data.error || `Image Studio svarade ${res.status}`);
  }
  return data.imageUrl as string;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY saknas" }, { status: 500 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }
  const history = (body.messages ?? []).slice(-20); // begränsa historiken
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Sista meddelandet måste vara från användaren" }, { status: 400 });
  }

  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  const images: GeneratedImage[] = [];
  let finalText = "";

  try {
    // Manuell tool-loop: kör tills Claude är klar (max 4 varv)
    for (let turn = 0; turn < 4; turn++) {
      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 3072,
        thinking: { type: "adaptive" },
        output_config: { effort: "low" },
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      finalText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      if (response.stop_reason !== "tool_use" || toolUses.length === 0) break;

      messages.push({ role: "assistant", content: response.content });

      // Kör alla verktygsanrop och skicka tillbaka resultaten i ETT user-meddelande
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        if (tu.name === "generate_image") {
          const input = tu.input as { prompt: string; aspectRatio?: string };
          try {
            const url = await generateImage(input.prompt, input.aspectRatio);
            images.push({ url, prompt: input.prompt });
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: `Bilden är genererad och visas för användaren. URL: ${url}`,
            });
          } catch (e) {
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: `Bildgenereringen misslyckades: ${(e as Error).message}`,
              is_error: true,
            });
          }
        } else if (tu.name === "validate_concept") {
          const input = tu.input as { concept: string };
          try {
            const v = await callCdAgenten("/api/validate", { concept: input.concept });
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify({
                overallScore: v.overallScore,
                scores: v.scores,
                summary: v.summary,
                strengths: v.strengths,
                improvements: v.improvements,
              }),
            });
          } catch (e) {
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: `Valideringen misslyckades: ${(e as Error).message}`,
              is_error: true,
            });
          }
        } else if (tu.name === "generate_concepts") {
          const input = tu.input as { brief: string };
          try {
            const g = await callCdAgenten("/api/generate", { brief: input.brief });
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify({ concepts: g.concepts }),
            });
          } catch (e) {
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: `Konceptgenereringen misslyckades: ${(e as Error).message}`,
              is_error: true,
            });
          }
        } else {
          results.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: `Okänt verktyg: ${tu.name}`,
            is_error: true,
          });
        }
      }
      messages.push({ role: "user", content: results });
    }

    return NextResponse.json({ text: finalText, images });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude-anropet misslyckades (${e.status}): ${e.message}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
