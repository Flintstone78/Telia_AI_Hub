import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const maxDuration = 60; // bildgenerering kan ta ~15-30 s

const IMAGE_STUDIO_URL = "https://telia-image-studio.vercel.app";

type ChatMessage = { role: "user" | "assistant"; text: string };
type GeneratedImage = { url: string; prompt: string };

const SYSTEM_PROMPT = `Du är NAVET — Fredriks personliga AI-hubb som dirigerar hans egna AI-verktyg.

Verktyg som är kopplade just nu:
- Image Studio (bildgenerering via verktyget generate_image). Bilderna genereras med Google Imagen 4 i Fredriks Image Studio.

Verktyg som finns men inte är kopplade till chatten ännu: CD-agenten (varumärkesgranskning), DISC-profilering (kommunikationsanalys). Om Fredrik ber om något de gör — förklara ärligt att de inte är kopplade ännu och länka till verktyget i stället.

Riktlinjer:
- Svara på svenska, kort och konkret.
- När Fredrik ber om en bild: skriv en genomarbetad engelsk prompt till generate_image (fotorealistisk om inget annat anges, gärna med ljussättning och miljö). Telias färgvärld är lila (#990AE3) när varumärket är relevant.
- Välj aspect ratio utifrån användningen: 16:9 för presentationer/hero, 1:1 för sociala medier, 9:16 för stories.
- Efter en genererad bild: beskriv kort vad du skapade. Bilden visas automatiskt i chatten.`;

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
];

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
        max_tokens: 2048,
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
