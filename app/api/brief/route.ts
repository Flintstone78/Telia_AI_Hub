import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { BriefDoc } from "@/lib/brief";
import { BRIEF_SECTIONS } from "@/lib/brief";

export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; text: string };

const SYSTEM_PROMPT = `Du är Brief-agenten — Fredriks strategiska planner på Telia Marknad. Du hjälper honom att gå från en lös tanke till en färdig kreativ brief genom samtal.

TELIAS VARUMÄRKE: Varm. Savvy. Rakt på sak. Ett huvudbudskap. Core Purple (#990AE3). Målgrupp: moderna svenskar.

DITT ARBETSSÄTT:
1. Fredrik berättar vad han vill skapa. Ställ smarta följdfrågor som en senior planner — max 1-2 frågor per svar, viktigast först. Fråga aldrig om sådant han redan sagt.
2. Uppdatera briefen LÖPANDE med verktyget update_brief så fort du lär dig något — även preliminära formuleringar. Skriv sektionerna som färdig brieftext (inte anteckningar), koncist och på svenska.
3. Använd webbsökning för omvärldsanalysen: sök på produkten/kategorin, konkurrenternas aktuella erbjudanden och kampanjer i Sverige. Sammanfatta det relevanta i omvarld-sektionen. Gör detta tidigt, utan att fråga om lov.
4. Föreslå själv formuleringar för mål, insikt och budskap när du har nog med underlag — Fredrik reagerar hellre på ett utkast än ett tomt fält.
5. När briefen känns komplett (de flesta sektionerna ifyllda): säg det, sammanfatta kort och fråga om något ska justeras.

Svara alltid kort och samtalsvänligt — briefen växer fram i panelen bredvid chatten, så du behöver inte upprepa den i text.`;

const tools: Anthropic.ToolUnion[] = [
  {
    name: "update_brief",
    description:
      "Uppdaterar en eller flera sektioner i briefen. Anropa så fort du lär dig något nytt. Skicka bara de sektioner som ändras — övriga behålls. Skriv färdig brieftext på svenska.",
    input_schema: {
      type: "object",
      properties: Object.fromEntries(
        BRIEF_SECTIONS.map((s) => [
          s.key,
          { type: "string", description: s.label },
        ])
      ),
    },
  },
  { type: "web_search_20260209", name: "web_search", max_uses: 3 },
];

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY saknas" }, { status: 500 });
  }

  let body: { messages?: ChatMessage[]; brief?: BriefDoc };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }
  const history = (body.messages ?? []).slice(-30);
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Sista meddelandet måste vara från användaren" }, { status: 400 });
  }

  const brief: BriefDoc = { ...(body.brief ?? {}) };
  const client = new Anthropic();

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `<aktuell_brief>${JSON.stringify(brief)}</aktuell_brief>\n(Detta är briefens nuvarande innehåll — bygg vidare på den, skriv inte om sektioner i onödan.)`,
    },
    { role: "assistant", content: "Uppfattat — jag bygger vidare på briefens nuvarande läge." },
    ...history.map((m) => ({ role: m.role, content: m.text } as Anthropic.MessageParam)),
  ];

  let finalText = "";
  let containerId: string | undefined;

  try {
    // Loop: hanterar både update_brief (klientverktyg) och webbsökning (pause_turn)
    for (let turn = 0; turn < 6; turn++) {
      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 3072,
        thinking: { type: "adaptive" },
        output_config: { effort: "low" },
        system: SYSTEM_PROMPT,
        tools,
        messages,
        ...(containerId ? { container: containerId } : {}),
      });
      if (response.container?.id) containerId = response.container.id;

      finalText =
        response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n") || finalText;

      if (response.stop_reason === "pause_turn") {
        // Serversidans webbsökning pausade — skicka tillbaka och fortsätt
        messages.push({ role: "assistant", content: response.content });
        continue;
      }

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      if (response.stop_reason !== "tool_use" || toolUses.length === 0) break;

      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        if (tu.name === "update_brief") {
          const updates = tu.input as Partial<BriefDoc>;
          for (const s of BRIEF_SECTIONS) {
            const v = updates[s.key];
            if (typeof v === "string" && v.trim()) brief[s.key] = v.trim();
          }
          results.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: "Briefen är uppdaterad och syns i panelen.",
          });
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

    return NextResponse.json({ text: finalText, brief });
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
