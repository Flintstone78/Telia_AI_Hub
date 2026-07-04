"use client";

import { useEffect, useRef, useState } from "react";

type Img = { url: string; prompt: string };
type Msg = { role: "user" | "assistant"; text: string; images?: Img[]; error?: boolean };

export default function ChatDock() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setOpen(true);
    const next: Msg[] = [...messages, { role: "user", text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Fel ${res.status}`);
      setMessages((cur) => [
        ...cur,
        { role: "assistant", text: data.text || "(inget svar)", images: data.images },
      ]);
    } catch (e) {
      setMessages((cur) => [
        ...cur,
        { role: "assistant", text: `Något gick fel: ${(e as Error).message}`, error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
      {/* Konversationspanel */}
      {open && messages.length > 0 && (
        <div className="card mb-2 flex max-h-[55vh] flex-col overflow-hidden border-purple-400/20 bg-ink-950/95 shadow-2xl shadow-purple-900/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <span className="text-sm font-medium text-purple-50">NAVET-chatten</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([])}
                title="Rensa konversationen"
                className="rounded-md px-2 py-1 text-xs text-purple-100/50 hover:bg-white/5 hover:text-purple-50"
              >
                Rensa
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Minimera"
                className="rounded-md p-1 text-purple-100/50 hover:bg-white/5 hover:text-purple-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-purple-500 text-white"
                      : m.error
                        ? "border border-red-400/30 bg-red-500/10 text-red-200"
                        : "border border-white/[0.07] bg-white/[0.04] text-purple-50"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.images?.map((img) => (
                    <a key={img.url} href={img.url} target="_blank" rel="noreferrer" className="mt-2 block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.prompt}
                        className="max-h-72 w-full rounded-lg border border-white/10 object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400 [animation-delay:300ms]" />
                  <span className="ml-1 text-xs text-purple-100/50">NAVET jobbar…</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inmatningsrad */}
      <div className="flex items-center gap-2 rounded-full border border-purple-400/25 bg-ink-900/90 py-1.5 pl-4 pr-1.5 shadow-xl shadow-purple-900/30 backdrop-blur-xl">
        {!open && messages.length > 0 && (
          <button
            onClick={() => setOpen(true)}
            title="Visa konversationen"
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-purple-100/70 hover:text-white"
          >
            {messages.length}
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Fråga NAVET något… t.ex. 'en bild på en tekniker som installerar en router'"
          className="min-w-0 flex-1 bg-transparent text-sm text-purple-50 placeholder:text-purple-100/40 outline-none"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          aria-label="Skicka"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white transition-colors hover:bg-purple-600 disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
