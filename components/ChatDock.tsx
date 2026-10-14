"use client";

import { useEffect, useRef, useState } from "react";
import Composer from "./Composer";
import UndoToast from "./UndoToast";
import { AssistantMessage, Thinking, UserMessage, isFresh } from "./Message";

type Img = { url: string; prompt: string };
type Msg = { role: "user" | "assistant"; text: string; images?: Img[]; error?: boolean; at?: number };

export default function ChatDock() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState<Msg[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const session = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setOpen(true);
    setCleared(null);
    const id = session.current;
    const next: Msg[] = [...messages, { role: "user", text, at: Date.now() }];
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
      if (id !== session.current) return;
      setMessages((cur) => [
        ...cur,
        { role: "assistant", text: data.text || "(inget svar)", images: data.images, at: Date.now() },
      ]);
    } catch (e) {
      if (id !== session.current) return;
      setMessages((cur) => [
        ...cur,
        { role: "assistant", text: `Något gick fel: ${(e as Error).message}`, error: true, at: Date.now() },
      ]);
    } finally {
      if (id === session.current) setBusy(false);
    }
  };

  const clear = () => {
    session.current += 1;
    setCleared(messages);
    setMessages([]);
    setBusy(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
      {/* Konversationspanel — växer upp ur inmatningsfältet */}
      {open && messages.length > 0 && (
        <div className="surface animate-pop-in mb-2 flex max-h-[60vh] origin-bottom flex-col overflow-hidden bg-ink-900/90">
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/telia-pebble.png" alt="" className="h-4 w-4 object-contain" />
              <span className="text-sm font-medium text-purple-50">NAVET-chatten</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clear} className="btn btn-sm btn-quiet">
                Rensa
              </button>
              <button onClick={() => setOpen(false)} aria-label="Minimera" className="btn btn-quiet h-8 w-8 p-0">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="scroll-fade flex-1 space-y-6 overflow-y-auto px-4 py-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <UserMessage key={i} text={m.text} fresh={isFresh(m.at)} />
              ) : (
                <AssistantMessage key={i} text={m.text} error={m.error} fresh={isFresh(m.at)}>
                  {m.images?.map((img) => (
                    <a
                      key={img.url}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="pressable mt-3 block overflow-hidden rounded-xl border border-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.prompt} className="max-h-80 w-full object-cover" />
                    </a>
                  ))}
                </AssistantMessage>
              )
            )}
            {busy && <Thinking label="NAVET tänker…" />}
          </div>
        </div>
      )}

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={send}
        busy={busy}
        placeholder="Fråga NAVET något, t.ex. be om en bild…"
        leading={
          !open && messages.length > 0 ? (
            <button
              onClick={() => setOpen(true)}
              aria-label={`Visa konversationen (${messages.length} meddelanden)`}
              className="btn btn-ghost -ml-2 h-7 px-2.5 text-xs tabular-nums"
            >
              {messages.length}
            </button>
          ) : undefined
        }
      />

      {cleared && (
        <UndoToast
          message="Konversationen rensad"
          onUndo={() => {
            session.current += 1;
            setMessages(cleared.map((m) => ({ ...m, at: undefined })));
            setCleared(null);
            setOpen(true);
          }}
          onDismiss={() => setCleared(null)}
          className="bottom-24"
        />
      )}
    </div>
  );
}
