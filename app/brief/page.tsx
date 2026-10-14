"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BriefDoc } from "@/lib/brief";
import { BRIEF_SECTIONS } from "@/lib/brief";
import { prefersReducedMotion } from "@/lib/spring";
import Composer from "@/components/Composer";
import RichText from "@/components/RichText";
import UndoToast from "@/components/UndoToast";
import BottomSheet from "@/components/BottomSheet";
import { AssistantMessage, Thinking, UserMessage, isFresh } from "@/components/Message";

type SectionKey = keyof BriefDoc;
type Msg = {
  role: "user" | "assistant";
  text: string;
  error?: boolean;
  /** Sektioner som det här svaret fyllde i eller ändrade */
  added?: SectionKey[];
  at?: number;
};
type Snapshot = { messages: Msg[]; brief: BriefDoc };

const STORAGE_KEY = "navet-brief-session";
/** Från hit räknas briefen som tillräckligt komplett för att lyftas fram */
const READY_AT = 6;
const STARTERS = [
  "En kampanj för Telia Play inför hösten",
  "Lansering av en ny tjänst för småföretag",
  "Intern kommunikation kring en förändring",
];

const labelOf = (key: SectionKey) => BRIEF_SECTIONS.find((s) => s.key === key)?.label ?? key;

function changedSections(before: BriefDoc, after: BriefDoc): SectionKey[] {
  return BRIEF_SECTIONS.map((s) => s.key).filter((k) => after[k] && after[k] !== before[k]);
}

function briefAsText(brief: BriefDoc) {
  return BRIEF_SECTIONS.filter((s) => brief[s.key])
    .map((s) => `${s.label}\n${brief[s.key]}`)
    .join("\n\n");
}

export default function BriefPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [brief, setBrief] = useState<BriefDoc>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [recent, setRecent] = useState<{ keys: SectionKey[]; rev: number }>({ keys: [], rev: 0 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [undo, setUndo] = useState<Snapshot | null>(null);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const flipFrom = useRef<number | null>(null);
  const session = useRef(0);
  const recentTimer = useRef<ReturnType<typeof setTimeout>>();

  const started = messages.length > 0;
  const filled = BRIEF_SECTIONS.filter((s) => brief[s.key]).length;

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
    const el = scrollRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    el.scrollTo({ top: el.scrollHeight, behavior: isFresh(last?.at) || busy ? "smooth" : "auto" });
  }, [messages, busy]);

  // Inmatningsfältet glider från mitten ned till sin plats när samtalet börjar
  useLayoutEffect(() => {
    const el = composerRef.current;
    if (flipFrom.current === null || !el) return;
    const delta = flipFrom.current - el.getBoundingClientRect().top;
    flipFrom.current = null;
    if (!delta || prefersReducedMotion()) return;
    el.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], {
      duration: 520,
      easing: "cubic-bezier(0.32, 0.72, 0, 1)",
    });
  }, [started]);

  const highlight = useCallback((keys: SectionKey[]) => {
    if (keys.length === 0) return;
    clearTimeout(recentTimer.current);
    setRecent((r) => ({ keys, rev: r.rev + 1 }));
    recentTimer.current = setTimeout(() => setRecent((r) => ({ ...r, keys: [] })), 2200);
  }, []);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    if (!started && composerRef.current) flipFrom.current = composerRef.current.getBoundingClientRect().top;
    setInput("");
    setUndo(null);
    const id = session.current;
    const next: Msg[] = [...messages, { role: "user", text, at: Date.now() }];
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
      if (id !== session.current) return;
      const updated: BriefDoc = data.brief ?? brief;
      const added = changedSections(brief, updated);
      setBrief(updated);
      setMessages((cur) => [
        ...cur,
        { role: "assistant", text: data.text || "(inget svar)", added, at: Date.now() },
      ]);
      highlight(added);
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

  const reset = () => {
    session.current += 1;
    setUndo({ messages, brief });
    setMessages([]);
    setBrief({});
    setInput("");
    setBusy(false);
    setSheetOpen(false);
  };

  const restore = () => {
    if (!undo) return;
    session.current += 1;
    setMessages(undo.messages.map((m) => ({ ...m, at: undefined })));
    setBrief(undo.brief);
    setUndo(null);
  };

  const showSection = (key: SectionKey) => {
    highlight([key]);
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!desktop) setSheetOpen(true);
    // Vänta en bildruta så att arket hunnit börja öppnas innan vi scrollar
    requestAnimationFrame(() => {
      document
        .getElementById(`brief-${key}-${desktop ? "panel" : "sheet"}`)
        ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(briefAsText(brief));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const pickStarter = (text: string) => {
    setInput(text);
    const field = composerRef.current?.querySelector("textarea");
    field?.focus();
    requestAnimationFrame(() => field?.setSelectionRange(text.length, text.length));
  };

  if (!loaded) return <div className="h-[100dvh]" />;

  const progress = (
    <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
      <div
        className="h-full origin-left rounded-full bg-gradient-to-r from-purple-500 to-purple-300 transition-transform duration-500"
        style={{ transform: `scaleX(${filled / BRIEF_SECTIONS.length})` }}
      />
    </div>
  );

  const count = (
    <span className="text-xs tabular-nums text-purple-100/55">
      <span className="font-medium text-purple-50">{filled}</span> av {BRIEF_SECTIONS.length}
    </span>
  );

  const copyButton = (
    <button
      onClick={copy}
      disabled={filled === 0}
      className={`btn btn-md w-full ${filled >= READY_AT ? "btn-primary" : "btn-ghost"}`}
    >
      <span key={copied ? "y" : "n"} className="flex items-center gap-2 animate-reveal">
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            Kopierad
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="12" height="12" rx="2.5" />
              <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
            </svg>
            Kopiera briefen
          </>
        )}
      </span>
    </button>
  );

  const sections = (where: "panel" | "sheet") => (
    <ol className="space-y-0.5 px-2">
      {BRIEF_SECTIONS.map((s) => {
        const value = brief[s.key];
        const isRecent = recent.keys.includes(s.key);
        return (
          <li
            key={isRecent ? `${s.key}-${recent.rev}` : s.key}
            id={`brief-${s.key}-${where}`}
            className={`scroll-my-3 rounded-xl px-3 ${value ? "py-3" : "py-2"} ${isRecent ? "animate-glow" : ""}`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  value ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "border border-white/25"
                } ${isRecent ? "animate-dot-pop" : ""}`}
              />
              <h3 className={`text-[13px] font-medium ${value ? "text-purple-100/75" : "text-purple-100/45"}`}>
                {s.label}
              </h3>
            </div>
            {value && (
              <RichText
                text={value}
                className={`mt-1.5 pl-4 text-[15px] leading-relaxed text-purple-50 ${isRecent ? "animate-reveal" : ""}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Tillbaka till NAVET" className="btn btn-ghost btn-icon sm:w-auto sm:px-3.5 sm:text-sm">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          <span className="hidden sm:inline">NAVET</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/telia-pebble.png" alt="" className="h-6 w-6 shrink-0 object-contain" />
          <h1 className="truncate font-heading text-lg text-white">Brief-agenten</h1>
          <span className="hidden truncate text-sm text-purple-100/50 md:inline">· Från tanke till färdig brief</span>
        </div>
        {started && (
          <button onClick={reset} className="btn btn-sm btn-ghost ml-auto">
            Börja om
          </button>
        )}
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1400px] flex-1 gap-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:pb-6">
        {/* Samtalet */}
        <section className={`flex min-h-0 flex-col ${started ? "pb-[68px] lg:pb-0" : "justify-center pb-16"}`}>
          <div ref={scrollRef} className={started ? "scroll-fade min-h-0 flex-1 overflow-y-auto" : "flex-none"}>
            <div className="mx-auto w-full max-w-[44rem] px-4 py-6 sm:px-2">
              {!started ? (
                <div className="flex flex-col items-center text-center">
                  <div className="animate-rise relative mb-7 h-14 w-14">
                    <div className="absolute inset-0 rounded-full bg-purple-500 opacity-50 blur-2xl" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/telia-pebble.png" alt="" className="relative h-14 w-14 object-contain" />
                  </div>
                  <h2
                    className="animate-rise font-heading text-4xl leading-[1.05] tracking-[-0.025em] text-white sm:text-5xl"
                    style={{ animationDelay: "50ms" }}
                  >
                    Vad vill du skapa?
                  </h2>
                  <p
                    className="animate-rise mt-4 max-w-md text-[15px] leading-relaxed text-purple-100/65"
                    style={{ animationDelay: "100ms" }}
                  >
                    Beskriv idén med egna ord. Jag ställer följdfrågor, kollar omvärlden och bygger
                    briefen medan vi pratar.
                  </p>
                </div>
              ) : (
                <div className="space-y-7">
                  {messages.map((m, i) =>
                    m.role === "user" ? (
                      <UserMessage key={i} text={m.text} fresh={isFresh(m.at)} />
                    ) : (
                      <AssistantMessage key={i} text={m.text} error={m.error} fresh={isFresh(m.at)}>
                        {m.added && m.added.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {m.added.map((k) => (
                              <button
                                key={k}
                                onClick={() => showSection(k)}
                                className="chip pressable hover:border-emerald-400/30 hover:text-purple-50"
                              >
                                <span className="text-emerald-300">+</span>
                                {labelOf(k)}
                              </button>
                            ))}
                          </div>
                        )}
                      </AssistantMessage>
                    )
                  )}
                  {busy && <Thinking label="Brief-agenten tänker…" />}
                </div>
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[44rem] px-4 pb-3 sm:px-2 lg:pb-0">
            <Composer
              ref={composerRef}
              value={input}
              onChange={setInput}
              onSubmit={() => send()}
              busy={busy}
              autoFocus={window.matchMedia("(pointer: fine)").matches}
              placeholder={started ? "Svara eller styr om…" : "Beskriv vad du vill skapa…"}
            />
            {!started ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {STARTERS.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => pickStarter(s)}
                    className="btn btn-sm btn-ghost animate-rise font-normal"
                    style={{ animationDelay: `${160 + i * 60}ms` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 hidden text-center text-[11px] text-purple-100/45 sm:block">
                Enter skickar · Shift + Enter ger ny rad
              </p>
            )}
          </div>
        </section>

        {/* Briefen — dokumentet som växer fram */}
        <aside className="surface hidden min-h-0 flex-col overflow-hidden lg:flex">
          <div className="px-5 pb-4 pt-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-heading text-xl text-white">Briefen</h2>
              {count}
            </div>
            <p className="mt-0.5 text-xs text-purple-100/55">
              {started ? "Fylls i medan ni pratar" : "Det här fyller vi i tillsammans"}
            </p>
            <div className="mt-4">{progress}</div>
          </div>
          <div className="scroll-fade min-h-0 flex-1 overflow-y-auto py-2">{sections("panel")}</div>
          {filled > 0 && <div className="animate-rise p-4 pt-2">{copyButton}</div>}
        </aside>
      </div>

      {/* Mobil: briefen som ett ark som dras upp */}
      {started && (
        <div className="lg:hidden">
          <BottomSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            label="briefen"
            header={
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-heading text-base text-white">Briefen</span>
                  {count}
                </div>
                <div className="mt-2">{progress}</div>
              </div>
            }
          >
            <div className="py-2">{sections("sheet")}</div>
            {filled > 0 && <div className="px-4 pb-6 pt-2">{copyButton}</div>}
          </BottomSheet>
        </div>
      )}

      {undo && (
        <UndoToast
          message="Briefen rensad"
          onUndo={restore}
          onDismiss={() => setUndo(null)}
          className="bottom-24 lg:bottom-8"
        />
      )}
    </div>
  );
}
