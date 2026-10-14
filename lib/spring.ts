/**
 * Fjäderanimationer med Apples parametrar: damping (1 = ingen översväng) och
 * response (ungefärlig tid i sekunder). Startar alltid från nuvarande värde och
 * hastighet, så att en rörelse kan avbrytas och tas över mitt i.
 */
export function animateSpring({
  from,
  to,
  velocity = 0,
  damping = 1,
  response = 0.35,
  onUpdate,
  onDone,
}: {
  from: number;
  to: number;
  /** px/s */
  velocity?: number;
  damping?: number;
  response?: number;
  onUpdate: (value: number) => void;
  onDone?: () => void;
}): () => void {
  const stiffness = (2 * Math.PI / response) ** 2;
  const friction = (4 * Math.PI * damping) / response;
  let x = from;
  let v = velocity;
  let last = performance.now();
  let raf = 0;

  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const substeps = 4;
    const h = dt / substeps;
    for (let i = 0; i < substeps; i++) {
      const a = -stiffness * (x - to) - friction * v;
      v += a * h;
      x += v * h;
    }
    if (Math.abs(v) < 1 && Math.abs(x - to) < 0.5) {
      onUpdate(to);
      onDone?.();
      return;
    }
    onUpdate(x);
    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/** Var en kastad rörelse skulle stanna — samma avtagande som vid scroll. */
export function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Ökande motstånd förbi en kant i stället för ett hårt stopp. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
