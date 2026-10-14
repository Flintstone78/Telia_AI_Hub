"use client";

import { forwardRef, useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  busy?: boolean;
  autoFocus?: boolean;
  /** Valfritt innehåll före textfältet, t.ex. en knapp som öppnar konversationen */
  leading?: ReactNode;
  className?: string;
};

const MAX_HEIGHT = 200;

/** Inmatningsfältet för NAVET:s chattar. Enter skickar, Shift+Enter ger ny rad. */
const Composer = forwardRef<HTMLDivElement, Props>(function Composer(
  { value, onChange, onSubmit, placeholder, busy = false, autoFocus, leading, className = "" },
  ref
) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !busy;

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  return (
    <div ref={ref} className={`composer ${className}`}>
      {leading && <div className="flex h-9 items-center">{leading}</div>}
      <textarea
        ref={textRef}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSubmit();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        // 16px på mobil så att iOS inte zoomar in vid fokus
        className="min-w-0 flex-1 resize-none bg-transparent py-1.5 text-base leading-6 text-purple-50 outline-none placeholder:text-purple-100/45 sm:text-[15px]"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSend}
        aria-label="Skicka"
        className="btn btn-icon btn-primary"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      </button>
    </div>
  );
});

export default Composer;
