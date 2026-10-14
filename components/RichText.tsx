import type { ReactNode } from "react";

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; text: string }
  | { kind: "ol"; start: number; items: string[] }
  | { kind: "ul"; items: string[] };

/** Tolkar den lilla delmängd markdown som agenterna skriver: stycken, listor, rubriker. */
function parse(text: string): Block[] {
  const blocks: Block[] = [];
  let gap = false;
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) {
      gap = true;
      continue;
    }
    const last = blocks[blocks.length - 1];
    const ol = /^(\d+)[.)]\s+(.*)$/.exec(line);
    const ul = /^[-*•]\s+(.*)$/.exec(line);
    const h = /^#{1,4}\s+(.*)$/.exec(line);
    if (ol) {
      if (last?.kind === "ol") last.items.push(ol[2]);
      else blocks.push({ kind: "ol", start: Number(ol[1]), items: [ol[2]] });
    } else if (ul) {
      if (last?.kind === "ul") last.items.push(ul[1]);
      else blocks.push({ kind: "ul", items: [ul[1]] });
    } else if (h) {
      blocks.push({ kind: "h", text: h[1] });
    } else if (last?.kind === "p" && !gap) {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "p", lines: [line] });
    }
    gap = false;
  }
  return blocks;
}

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  INLINE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(
        <strong key={m.index} className="font-medium text-white">
          {m[1]}
        </strong>
      );
    } else {
      out.push(
        <a
          key={m.index}
          href={m[3]}
          target="_blank"
          rel="noreferrer"
          className="text-purple-200 underline decoration-purple-400/40 underline-offset-2 transition-colors hover:decoration-purple-200"
        >
          {m[2]}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {parse(text).map((b, i) => {
        if (b.kind === "h") {
          return (
            <p key={i} className="font-medium text-white">
              {inline(b.text)}
            </p>
          );
        }
        if (b.kind === "p") {
          return (
            <p key={i}>
              {b.lines.map((l, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {inline(l)}
                </span>
              ))}
            </p>
          );
        }
        const items = b.items.map((it, j) => (
          <li key={j} className="pl-1">
            {inline(it)}
          </li>
        ));
        return b.kind === "ol" ? (
          <ol key={i} start={b.start} className="list-decimal space-y-1.5 pl-5 marker:text-purple-300/70">
            {items}
          </ol>
        ) : (
          <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-purple-300/70">
            {items}
          </ul>
        );
      })}
    </div>
  );
}
