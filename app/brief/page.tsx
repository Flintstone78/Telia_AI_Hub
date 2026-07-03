import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brief Generator — NAVET",
  description: "Brief Generator byggs här — en del av NAVET.",
};

export default function BriefPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full bg-purple-500 opacity-50 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-purple-300/60 bg-gradient-to-br from-purple-500/30 to-purple-700/30 text-2xl font-bold text-purple-100">
          B
        </div>
      </div>
      <div>
        <h1 className="font-heading text-3xl text-white sm:text-4xl">Brief Generator</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-purple-100/60">
          Här byggs Brief Generator — agenten som tar emot en rå brief och
          strukturerar den: mål, målgrupp, kanaler och leverabler. Platsen är
          reserverad, verktyget är på väg.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-purple-100/80 transition-colors hover:border-purple-400/40 hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Tillbaka till NAVET
      </Link>
    </main>
  );
}
