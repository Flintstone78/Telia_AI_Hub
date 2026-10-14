"use client";

import { useEffect, useRef } from "react";

type Props = {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
  className?: string;
};

/** Ångra i stället för att fråga först — handlingen sker direkt men går att ta tillbaka. */
export default function UndoToast({ message, onUndo, onDismiss, duration = 10000, className = "bottom-6" }: Props) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    let remaining = duration;
    let started = Date.now();
    let timer = setTimeout(() => dismiss.current(), remaining);
    // Pausa nedräkningen när fliken inte syns
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
        remaining -= Date.now() - started;
      } else {
        started = Date.now();
        timer = setTimeout(() => dismiss.current(), remaining);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [duration]);

  return (
    <div
      role="status"
      className={`animate-pop-in fixed inset-x-0 z-[60] mx-auto flex w-max max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-white/10 bg-ink-800/90 py-1.5 pl-4 pr-1.5 text-sm text-purple-50 shadow-2xl shadow-black/40 backdrop-blur-2xl ${className}`}
    >
      {message}
      <button onClick={onUndo} className="btn btn-sm btn-ghost">
        Ångra
      </button>
    </div>
  );
}
