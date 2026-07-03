"use client";

import { useEffect, useRef } from "react";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onOpenMenu: () => void;
};

export default function TopBar({ query, onQueryChange, onOpenMenu }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") inputRef.current?.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onOpenMenu}
          aria-label="Öppna meny"
          className="rounded-md p-2 text-purple-100/70 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="relative mx-auto w-full max-w-xl">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-100/40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Sök verktyg, idéer, taggar…"
            className="h-9 w-full rounded-full border border-white/10 bg-white/[0.04] pl-9 pr-14 text-sm text-purple-50 placeholder:text-purple-100/40 outline-none transition-colors focus:border-purple-400/50 focus:bg-white/[0.07]"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-purple-100/50">
            ⌘K
          </kbd>
        </div>

        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-xs font-bold text-white ring-2 ring-purple-500/30"
          title="Fredrik"
        >
          FV
        </div>
      </div>
    </header>
  );
}
