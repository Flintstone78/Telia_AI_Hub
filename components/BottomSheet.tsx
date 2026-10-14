"use client";

import { useCallback, useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { animateSpring, prefersReducedMotion, project, rubberband } from "@/lib/spring";

const PEEK = 68;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Syns i den hopfällda fliken */
  header: ReactNode;
  label: string;
  children: ReactNode;
};

type Drag = {
  id: number;
  startY: number;
  origin: number;
  moved: boolean;
  samples: Array<{ y: number; t: number }>;
};

/**
 * Ark som dras upp nerifrån. Följer fingret 1:1, tar med sig hastigheten när man
 * släpper och kan fångas mitt i en rörelse.
 */
export default function BottomSheet({ open, onOpenChange, header, label, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const y = useRef<number | null>(null);
  const target = useRef<number | null>(null);
  const max = useRef(0);
  const cancel = useRef<(() => void) | null>(null);
  const drag = useRef<Drag | null>(null);
  const openRef = useRef(open);

  const apply = useCallback((v: number) => {
    y.current = v;
    if (sheetRef.current) sheetRef.current.style.transform = `translate3d(0, ${v}px, 0)`;
    const progress = max.current ? Math.min(1, Math.max(0, 1 - v / max.current)) : 0;
    if (scrimRef.current) {
      scrimRef.current.style.opacity = String(progress);
      scrimRef.current.style.pointerEvents = progress > 0.05 ? "auto" : "none";
    }
  }, []);

  const settle = useCallback(
    (to: number, velocity = 0, momentum = false) => {
      cancel.current?.();
      target.current = to;
      if (prefersReducedMotion() || y.current === null) {
        apply(to);
        return;
      }
      // Lätt studs bara när en kaströrelse föregick; annars kritiskt dämpad
      cancel.current = animateSpring({
        from: y.current,
        to,
        velocity,
        damping: momentum ? 0.8 : 1,
        response: momentum ? 0.3 : 0.38,
        onUpdate: apply,
      });
    },
    [apply]
  );

  useEffect(() => {
    const measure = () => {
      const h = sheetRef.current?.offsetHeight ?? 0;
      max.current = Math.max(0, h - PEEK);
      if (y.current === null) {
        // Första gången: börja helt dold och glid upp till fliken
        apply(h);
        settle(openRef.current ? 0 : max.current);
      } else if (!drag.current) {
        cancel.current?.();
        target.current = openRef.current ? 0 : max.current;
        apply(target.current);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancel.current?.();
    };
  }, [apply, settle]);

  useEffect(() => {
    openRef.current = open;
    const to = open ? 0 : max.current;
    if (drag.current || target.current === to) return;
    settle(to);
  }, [open, settle]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current || e.button !== 0) return; // ett finger i taget
    cancel.current?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      id: e.pointerId,
      startY: e.clientY,
      origin: y.current ?? max.current,
      moved: false,
      samples: [{ y: e.clientY, t: e.timeStamp }],
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dy) < 6) return;
    d.moved = true;
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    if (d.samples.length > 8) d.samples.shift();
    let next = d.origin + dy;
    if (next < 0) next = -rubberband(-next, max.current);
    else if (next > max.current) next = max.current + rubberband(next - max.current, max.current);
    apply(next);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;

    if (!d.moved) {
      const nextOpen = !openRef.current;
      openRef.current = nextOpen;
      onOpenChange(nextOpen);
      settle(nextOpen ? 0 : max.current);
      return;
    }

    const last = d.samples[d.samples.length - 1];
    const recent = d.samples.filter((s) => last.t - s.t <= 100);
    const first = recent[0];
    const dt = (last.t - first.t) / 1000;
    const velocity = dt > 0 ? (last.y - first.y) / dt : 0;
    const landing = (y.current ?? 0) + project(velocity);
    const nextOpen = Math.abs(landing) < Math.abs(landing - max.current);
    const to = nextOpen ? 0 : max.current;
    settle(to, velocity, true);
    if (nextOpen !== openRef.current) {
      openRef.current = nextOpen;
      onOpenChange(nextOpen);
    }
  };

  return (
    <>
      <div
        ref={scrimRef}
        aria-hidden
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 z-40 bg-black/55"
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-label={label}
        className="surface fixed inset-x-0 bottom-0 z-50 flex h-[86dvh] flex-col rounded-b-none rounded-t-3xl border-b-0 bg-ink-900/95 will-change-transform"
        style={{ transform: "translate3d(0, 100%, 0)" }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-label={open ? `Fäll ihop ${label}` : `Visa ${label}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenChange(!open);
            }
          }}
          className="shrink-0 cursor-grab touch-none select-none px-5 pt-2 outline-none active:cursor-grabbing"
          style={{ height: PEEK }}
        >
          <div className="mx-auto mb-2.5 h-1 w-9 rounded-full bg-white/25" />
          {header}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </>
  );
}
