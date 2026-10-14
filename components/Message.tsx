import type { ReactNode } from "react";
import RichText from "./RichText";

/** Meddelanden som skapats nyss animeras in; återställda från historiken visas direkt. */
export function isFresh(at?: number) {
  return at !== undefined && Date.now() - at < 1500;
}

export function UserMessage({ text, fresh }: { text: string; fresh?: boolean }) {
  return (
    <div className={`flex justify-end ${fresh ? "animate-rise" : ""}`}>
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-purple-400/20 bg-purple-500/20 px-4 py-2.5 text-[15px] leading-6 text-purple-50">
        {text}
      </div>
    </div>
  );
}

export function AssistantMessage({
  text,
  error,
  fresh,
  children,
}: {
  text: string;
  error?: boolean;
  fresh?: boolean;
  children?: ReactNode;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className={`flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200 ${fresh ? "animate-rise" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
        {text}
      </div>
    );
  }
  return (
    <div className={fresh ? "animate-rise" : ""}>
      <RichText text={text} className="text-[15px] leading-7 text-purple-50/90" />
      {children}
    </div>
  );
}

export function Thinking({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 animate-fade" aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/telia-pebble.png" alt="" className="h-4 w-4 object-contain opacity-80" />
      <span className="text-shimmer text-sm">{label}</span>
    </div>
  );
}
