"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BriefDoc } from "@/lib/brief";
import { BRIEF_SECTIONS } from "@/lib/brief";

type Msg = { role: "user" | "assistant"; text: string; error?: boolean };

const STORAGE_KEY = "navet-brief-session";

export default function BriefPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [brief, setBrief] = useState<BriefDoc>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Återuppta pågående brief-session från localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setMessages(saved.messages ?? []);
        setBrief(saved.brief ?? {});
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, brief }));
    } catch {}
  }, [messages, brief, loaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const filled = BRIEF_SECTIONS.filter((s) => brief[s.key]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, text: m.text })),
          brief,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Fel ${res.status}`);
      setBrief(data.brief ?? brief);
      setMessages((cur) => [...cur, { role: "assistant", text: data.text || "(inget svar)" }]);
    } catch (e) {
      setMessages((cur) => [
        ...cur,
        { role: "assistant", text: `Något gick fel: ${(e as Error).message}`, error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    if (!confirm("Börja om? Chatten och briefen rensas.")) return;
    setMessages([]);
    setBrief({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col p-4 sm:p-6">
      {/* Toppbar */}
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-purple-100/70 transition-colors hover:border-purple-400/40 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          NAVET
        </Link>
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/telia-pebble.png" alt="" className="h-7 w-7 object-contain" />
          <div>
            <h1 className="font-heading text-lg leading-tight text-white">Brief-agenten</h1>
            <p className="text-[11px] text-purple-100/50">Från tanke till färdig brief</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-purple-100/50">
            {filled.length}/{BRIEF_SECTIONS.length} sektioner
          </span>
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-purple-100/60 hover:text-white"
            >
              Börja om
            </button>
          )}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_400px]">
        {/* Chatt */}
        <div className="card flex min-h-[60vh] flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full bg-purple-500 opacity-40 blur-xl" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/telia-pebble.png" alt="" className="relative h-12 w-12 object-contain" />
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-purple-100/60">
                  Berätta vad du vill skapa — t.ex. <em>"en kampanj för Telia Play inför hösten"</em>.
                  Jag ställer följdfrågor, kollar omvärlden och bygger briefen medan vi pratar.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-purple-500 text-white"
                      : m.error
                        ? "border border-red-400/30 bg-red-500/10 text-red-200"
                        : "border border-white/[0.07] bg-white/[0.04] text-purple-50"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400 [animation-delay:300ms]" />
                  <span className="ml-1 text-xs text-purple-100/50">Brief-agenten jobbar…</span>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-white/[0.06] p-3">
            <div className="flex items-center gap-2 rounded-full border border-purple-400/25 bg-ink-900/80 py-1 pl-4 pr-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={messages.length === 0 ? "Vad vill du skapa?" : "Svara eller styr om…"}
                className="min-w-0 flex-1 bg-transparent text-sm text-purple-50 placeholder:text-purple-100/40 outline-none"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                aria-label="Skicka"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white transition-colors hover:bg-purple-600 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Brief-panelen */}
        <div className="card flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <h2 className="font-heading text-base text-white">Briefen</h2>
              <p className="text-[11px] text-purple-100/50">Växer fram medan ni pratar</p>
            </div>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${(filled.length / BRIEF_SECTIONS.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {BRIEF_SECTIONS.map((s) => {
              const value = brief[s.key];
              return (
                <div key={s.key}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${value ? "bg-emerald-400" : "bg-white/15"}`}
                    />
                    <span
                      className={`text-[11px] font-medium uppercase tracking-wider ${
                        value ? "text-purple-100/70" : "text-purple-100/30"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {value ? (
                    <p className="mt-1 pl-3.5 text-sm leading-relaxed text-purple-50/90">{value}</p>
                  ) : (
                    <p className="mt-1 pl-3.5 text-xs italic text-purple-100/25">Inte ifylld ännu</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-white/[0.06] p-3">
            <button
              disabled
              title="PPT-export kommer i nästa steg — mallen från CD-agenten återanvänds"
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2 text-sm text-purple-100/40"
            >
              Exportera till PPT · på väg
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
