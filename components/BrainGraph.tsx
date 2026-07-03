"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { Node, NodeStatus } from "@/lib/types";

type SimNode = SimulationNodeDatum & {
  id: string;
  name: string;
  status: NodeStatus | "hub";
  phase: number;
};

type SimLink = SimulationLinkDatum<SimNode>;

type Particle = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  phase: number;
  speed: number;
};

const STATUS_STYLE: Record<
  NodeStatus,
  { r: number; glow: number; color: string; halo: string; label: string }
> = {
  live: { r: 11, glow: 26, color: "#CC88F0", halo: "rgba(153,10,227,0.85)", label: "Live" },
  beta: { r: 9, glow: 18, color: "#B44FEA", halo: "rgba(153,10,227,0.6)", label: "Beta" },
  idea: { r: 7, glow: 10, color: "#7B3FA8", halo: "rgba(115,0,173,0.4)", label: "Idé" },
};

const HUB_ID = "__hub__";
const PEBBLE_ASPECT = 538 / 512; // höjd/bredd för telia-pebble.png

// Deterministisk pseudo-slump så partikelmolnet blir likadant varje render
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGraph(nodes: Node[]) {
  const simNodes: SimNode[] = [
    { id: HUB_ID, name: "NAVET", status: "hub", fx: 0, fy: 0, phase: 0 },
    ...nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      const dist = n.status === "live" ? 150 : n.status === "beta" ? 175 : 205;
      return {
        id: n.id,
        name: n.name,
        status: n.status,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        phase: i * 1.7,
      };
    }),
  ];

  const seen = new Set<string>();
  const links: SimLink[] = [];
  for (const n of nodes) {
    links.push({ source: HUB_ID, target: n.id });
    for (const c of n.connections ?? []) {
      if (!nodes.some((m) => m.id === c)) continue;
      const key = [n.id, c].sort().join("→");
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ source: n.id, target: c });
    }
  }
  return { simNodes, links };
}

function buildParticles() {
  const rand = mulberry32(42);
  const particles: Particle[] = [];
  for (let i = 0; i < 130; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 30 + 270 * Math.pow(rand(), 0.65);
    particles.push({
      x: Math.cos(angle) * dist * 1.2,
      y: Math.sin(angle) * dist * 0.85,
      r: 0.6 + rand() * 1.5,
      alpha: 0.15 + rand() * 0.5,
      phase: rand() * Math.PI * 2,
      speed: 0.3 + rand() * 0.6,
    });
  }
  // Koppla ihop närliggande partiklar till ett tunt organiskt nät
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < particles.length; i++) {
    let count = 0;
    for (let j = i + 1; j < particles.length && count < 2; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      if (dx * dx + dy * dy < 70 * 70) {
        pairs.push([i, j]);
        count++;
      }
    }
  }
  return { particles, pairs };
}

type Props = {
  nodes: Node[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  query: string;
};

export default function BrainGraph({ nodes, selectedId, onSelect, query }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: Node } | null>(null);

  const graph = useMemo(() => buildGraph(nodes), [nodes]);
  const scene = useMemo(() => buildParticles(), []);

  // Muterbart tillstånd som render-loopen läser utan att trigga React
  const view = useRef({ k: 1, panX: 0, panY: 0 });
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef(selectedId);
  const queryRef = useRef(query);
  selectedRef.current = selectedId;
  queryRef.current = query;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fontFamily = getComputedStyle(document.body).fontFamily || "system-ui";
    let width = 0;
    let height = 0;
    let raf = 0;

    // Telia-pebblen i mitten
    const pebble = new Image();
    pebble.src = "/telia-pebble.png";

    // Levande simulering: startar nästan färdiglagd och mjuklandar,
    // väcks igen när man drar i en nod
    const sim = forceSimulation(graph.simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(graph.links)
          .id((d) => d.id)
          .distance((l) => {
            const t = l.target as SimNode;
            if ((l.source as SimNode).id === HUB_ID) {
              return t.status === "live" ? 150 : t.status === "beta" ? 175 : 210;
            }
            return 130;
          })
          .strength(0.5)
      )
      .force("charge", forceManyBody().strength(-450))
      .force("collide", forceCollide(48))
      .force("x", forceX(0).strength(0.045))
      .force("y", forceY(0).strength(0.06))
      .stop();
    sim.tick(150);
    sim.alpha(0.5).alphaMin(0.001).restart();

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      fit();
    };

    const fit = () => {
      let minX = -60, maxX = 60, minY = -60, maxY = 60;
      for (const n of graph.simNodes) {
        // Label-pillen ritas bort från centrum — ge plats åt rätt håll
        const x = n.x ?? 0;
        minX = Math.min(minX, x < 0 ? x - 150 : x - 40);
        maxX = Math.max(maxX, x < 0 ? x + 40 : x + 150);
        minY = Math.min(minY, (n.y ?? 0) - 40);
        maxY = Math.max(maxY, (n.y ?? 0) + 40);
      }
      const k = Math.min((width - 32) / (maxX - minX), (height - 32) / (maxY - minY));
      view.current.k = Math.max(0.4, Math.min(1.6, k));
      view.current.panX = -((minX + maxX) / 2) * view.current.k;
      view.current.panY = -((minY + maxY) / 2) * view.current.k;
    };

    const toScreen = (x: number, y: number) => ({
      x: width / 2 + x * view.current.k + view.current.panX,
      y: height / 2 + y * view.current.k + view.current.panY,
    });
    const toWorld = (sx: number, sy: number) => ({
      x: (sx - width / 2 - view.current.panX) / view.current.k,
      y: (sy - height / 2 - view.current.panY) / view.current.k,
    });

    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const q = () => queryRef.current.trim().toLowerCase();
    const matches = (n: Node) => {
      const s = q();
      if (!s) return true;
      return (
        n.name.toLowerCase().includes(s) ||
        n.description.toLowerCase().includes(s) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(s))
      );
    };

    let dragNode: SimNode | null = null;

    const floatX = (n: SimNode, t: number) =>
      n.status === "hub" || n === dragNode ? 0 : Math.sin(t * 0.35 + n.phase) * 3.5;
    const floatY = (n: SimNode, t: number) =>
      n.status === "hub" || n === dragNode ? 0 : Math.cos(t * 0.3 + n.phase * 1.3) * 3.5;

    const draw = (now: number) => {
      const t = now / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const k = view.current.k;

      // Partikelnät
      ctx.lineWidth = 0.5;
      for (const [i, j] of scene.pairs) {
        const a = scene.particles[i];
        const b = scene.particles[j];
        const pa = toScreen(a.x, a.y);
        const pb = toScreen(b.x, b.y);
        ctx.strokeStyle = `rgba(180, 79, 234, ${0.05 + 0.02 * Math.sin(t + a.phase)})`;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
      for (const p of scene.particles) {
        const tw = 0.6 + 0.4 * Math.sin(t * p.speed + p.phase);
        const s = toScreen(p.x + Math.sin(t * p.speed * 0.5 + p.phase) * 4, p.y + Math.cos(t * p.speed * 0.4 + p.phase) * 4);
        ctx.fillStyle = `rgba(204, 136, 240, ${p.alpha * tw})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, p.r * k, 0, Math.PI * 2);
        ctx.fill();
      }

      // Länkar mellan noder (svagt böjda, pulserande linjer)
      for (const l of graph.links) {
        const a = l.source as SimNode;
        const b = l.target as SimNode;
        const pa = toScreen((a.x ?? 0) + floatX(a, t), (a.y ?? 0) + floatY(a, t));
        const pb = toScreen((b.x ?? 0) + floatX(b, t), (b.y ?? 0) + floatY(b, t));
        const mx = (pa.x + pb.x) / 2 - (pb.y - pa.y) * 0.12;
        const my = (pa.y + pb.y) / 2 + (pb.x - pa.x) * 0.12;
        const pulse = 0.8 + 0.2 * Math.sin(t * 1.5 + (a.phase + b.phase));
        const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
        grad.addColorStop(0, `rgba(180, 79, 234, ${0.28 * pulse})`);
        grad.addColorStop(1, `rgba(153, 10, 227, ${0.1 * pulse})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
        ctx.stroke();
      }

      // Central Telia-pebble med glöd
      const hub = graph.simNodes[0];
      const hs = toScreen(hub.x ?? 0, hub.y ?? 0);
      const pw = 64 * k * (1 + 0.025 * Math.sin(t * 1.2)); // pebble-bredd, mjuk puls
      const glowR = pw * 1.9;
      const glow = ctx.createRadialGradient(hs.x, hs.y, pw * 0.25, hs.x, hs.y, glowR);
      glow.addColorStop(0, "rgba(153, 10, 227, 0.55)");
      glow.addColorStop(0.5, "rgba(153, 10, 227, 0.14)");
      glow.addColorStop(1, "rgba(153, 10, 227, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(hs.x, hs.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      if (pebble.complete && pebble.naturalWidth > 0) {
        const ph = pw * PEBBLE_ASPECT;
        ctx.save();
        ctx.shadowColor = "rgba(204, 136, 240, 0.8)";
        ctx.shadowBlur = 22 * k;
        ctx.drawImage(pebble, hs.x - pw / 2, hs.y - ph / 2, pw, ph);
        ctx.restore();
      }

      // Verktygsnoder + label-pills
      for (const n of graph.simNodes) {
        if (n.status === "hub") continue;
        const data = nodeById.get(n.id);
        if (!data) continue;
        const style = STATUS_STYLE[n.status as NodeStatus];
        const dim = matches(data) ? 1 : 0.15;
        const hovered = hoveredRef.current === n.id;
        const selected = selectedRef.current === n.id;
        const dragged = dragNode === n;
        const p = toScreen((n.x ?? 0) + floatX(n, t), (n.y ?? 0) + floatY(n, t));
        const r = style.r * k * (hovered || selected || dragged ? 1.25 : 1);

        ctx.globalAlpha = dim;
        const haloR = r * (hovered || selected || dragged ? 4.5 : 3.2) * (1 + 0.06 * Math.sin(t * 1.8 + n.phase));
        const halo = ctx.createRadialGradient(p.x, p.y, r * 0.4, p.x, p.y, haloR);
        halo.addColorStop(0, style.halo);
        halo.addColorStop(1, "rgba(153,10,227,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.1, p.x, p.y, r);
        g.addColorStop(0, "#F4E0FF");
        g.addColorStop(0.4, style.color);
        g.addColorStop(1, n.status === "idea" ? "#3D0059" : "#7300AD");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        if (n.status === "idea") {
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = "rgba(204,136,240,0.6)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (selected) {
          ctx.strokeStyle = "rgba(244,224,255,0.9)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Label-pill, placerad bort från centrum
        const fontSize = Math.max(10, 11.5 * Math.min(k, 1.1));
        ctx.font = `500 ${fontSize}px ${fontFamily}`;
        const tw = ctx.measureText(data.name).width;
        const padX = 10;
        const ph2 = fontSize + 12;
        const gap = r + 10;
        const left = (n.x ?? 0) < 0;
        const px = left ? p.x - gap - tw - padX * 2 : p.x + gap;
        const py = p.y - ph2 / 2;
        ctx.fillStyle = hovered || selected ? "rgba(61,0,89,0.92)" : "rgba(18,6,33,0.82)";
        ctx.strokeStyle = hovered || selected ? "rgba(204,136,240,0.7)" : "rgba(180,79,234,0.30)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px, py, tw + padX * 2, ph2, ph2 / 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = hovered || selected ? "#F4E0FF" : "rgba(244,224,255,0.85)";
        ctx.textBaseline = "middle";
        ctx.fillText(data.name, px + padX, py + ph2 / 2 + 0.5);
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    };

    // Träffyta: nod (inkl. lite marginal)
    const hitTest = (sx: number, sy: number): SimNode | null => {
      const t = performance.now() / 1000;
      for (const n of graph.simNodes) {
        if (n.status === "hub") continue;
        const p = toScreen((n.x ?? 0) + floatX(n, t), (n.y ?? 0) + floatY(n, t));
        const style = STATUS_STYLE[n.status as NodeStatus];
        const r = Math.max(style.r * view.current.k + 8, 16);
        const dx = sx - p.x;
        const dy = sy - p.y;
        if (dx * dx + dy * dy < r * r) return n;
      }
      return null;
    };

    // Interaktion: dra noder, panorera, pinch-zooma, hovra, klicka
    const pointers = new Map<number, { x: number; y: number }>();
    let panStart: { x: number; y: number; panX: number; panY: number } | null = null;
    let pinchStart: { dist: number; k: number } | null = null;
    let moved = false;

    const pos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const p = pos(e);
      pointers.set(e.pointerId, p);
      moved = false;
      if (pointers.size === 1) {
        const hit = hitTest(p.x, p.y);
        if (hit) {
          // Greppa noden — simuleringen vaknar och resten av grafen följer med
          dragNode = hit;
          const w = toWorld(p.x, p.y);
          dragNode.fx = w.x;
          dragNode.fy = w.y;
          sim.alphaTarget(0.25).restart();
          canvas.style.cursor = "grabbing";
        } else {
          panStart = { ...p, panX: view.current.panX, panY: view.current.panY };
        }
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), k: view.current.k };
        if (dragNode) {
          dragNode.fx = null;
          dragNode.fy = null;
          dragNode = null;
          sim.alphaTarget(0);
        }
        panStart = null;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const p = pos(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);

      if (pointers.size === 2 && pinchStart) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        view.current.k = Math.max(0.3, Math.min(3, (pinchStart.k * dist) / pinchStart.dist));
        moved = true;
        return;
      }
      if (dragNode && pointers.size === 1) {
        const w = toWorld(p.x, p.y);
        dragNode.fx = w.x;
        dragNode.fy = w.y;
        moved = true;
        setTooltip(null);
        return;
      }
      if (panStart && pointers.size === 1) {
        const dx = p.x - panStart.x;
        const dy = p.y - panStart.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        view.current.panX = panStart.panX + dx;
        view.current.panY = panStart.panY + dy;
        return;
      }
      // Hover (mus)
      const hit = hitTest(p.x, p.y);
      hoveredRef.current = hit?.id ?? null;
      canvas.style.cursor = hit ? "grab" : "default";
      if (hit) {
        const node = nodeById.get(hit.id);
        if (node) setTooltip({ x: p.x, y: p.y, node });
      } else {
        setTooltip(null);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const p = pos(e);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (dragNode) {
        const id = dragNode.id;
        dragNode.fx = null;
        dragNode.fy = null;
        dragNode = null;
        sim.alphaTarget(0);
        canvas.style.cursor = "grab";
        if (!moved) {
          onSelect(id);
          setTooltip(null);
        }
        return;
      }
      if (pointers.size === 0) {
        if (!moved) {
          onSelect(null);
          setTooltip(null);
        }
        panStart = null;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      view.current.k = Math.max(0.3, Math.min(3, view.current.k * factor));
    };

    const onLeave = () => {
      hoveredRef.current = null;
      setTooltip(null);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.style.touchAction = "none";

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    raf = requestAnimationFrame(draw);

    // Zoomkontroller styr via CustomEvent från knapparna
    const onZoom = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      if (action === "in") view.current.k = Math.min(3, view.current.k * 1.25);
      if (action === "out") view.current.k = Math.max(0.3, view.current.k / 1.25);
      if (action === "fit") fit();
      if (action === "center") {
        view.current.panX = 0;
        view.current.panY = 0;
        view.current.k = 1;
      }
    };
    container.addEventListener("braingraph:zoom", onZoom);

    return () => {
      sim.stop();
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
      container.removeEventListener("braingraph:zoom", onZoom);
    };
  }, [graph, scene, nodes, onSelect]);

  const zoom = (action: string) => {
    containerRef.current?.dispatchEvent(
      new CustomEvent("braingraph:zoom", { detail: action })
    );
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Zoomkontroller */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
        {[
          { a: "in", icon: "+", title: "Zooma in" },
          { a: "out", icon: "−", title: "Zooma ut" },
          { a: "fit", icon: "⤢", title: "Anpassa till vy" },
          { a: "center", icon: "◎", title: "Centrera" },
        ].map((b) => (
          <button
            key={b.a}
            title={b.title}
            aria-label={b.title}
            onClick={() => zoom(b.a)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-ink-900/80 text-sm text-purple-100/80 backdrop-blur transition-colors hover:border-purple-400/40 hover:text-white"
          >
            {b.icon}
          </button>
        ))}
      </div>

      {/* Hover-tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[240px] rounded-lg border border-purple-400/30 bg-ink-900/95 px-3 py-2 shadow-lg shadow-purple-900/40"
          style={{
            left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth ?? 300) - 250),
            top: tooltip.y + 14,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-purple-50">{tooltip.node.name}</span>
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-purple-200">
              {STATUS_STYLE[tooltip.node.status].label}
            </span>
          </div>
          <p className="mt-1 text-xs text-purple-100/60">Dra för att flytta · klicka för detaljer</p>
        </div>
      )}
    </div>
  );
}
