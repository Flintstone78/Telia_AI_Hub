"use client";

import { useEffect, useMemo, useState } from "react";
import { nodes } from "@/data/tools";
import { pipeline } from "@/data/pipeline";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import StatsRow from "@/components/StatsRow";
import BrainGraph from "@/components/BrainGraph";
import NodeDetail from "@/components/NodeDetail";
import Pipeline from "@/components/Pipeline";
import QuickAccess from "@/components/QuickAccess";
import AddContentModal from "@/components/AddContentModal";
import ChatDock from "@/components/ChatDock";

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [greeting, setGreeting] = useState("Hej");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 5 ? "God natt" : h < 10 ? "God morgon" : h < 18 ? "Hej" : "God kväll");
  }, []);

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [selectedId]
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <Sidebar
        nodes={nodes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onOpenAdd={() => setAddOpen(true)}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="min-w-0 flex-1">
        <TopBar query={query} onQueryChange={setQuery} onOpenMenu={() => setMenuOpen(true)} />

        <main className="grid gap-4 p-4 pb-28 sm:p-6 sm:pb-28 xl:grid-cols-[1fr_320px]">
          {/* Vänster/huvudkolumn */}
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-heading text-3xl text-white sm:text-4xl">
                  {greeting}, Fredrik 👋
                </h1>
                <p className="mt-1 text-sm text-purple-100/60">
                  Dina AI-verktyg — byggda, i beta och på idéstadiet.
                </p>
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-colors hover:bg-purple-600"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Lägg till nod
              </button>
            </div>

            <StatsRow nodes={nodes} pipeline={pipeline} />

            {/* HERO: partikelhjärnan */}
            <div className="card relative overflow-hidden">
              <div className="h-[380px] sm:h-[460px] lg:h-[520px]">
                <BrainGraph
                  nodes={nodes}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  query={query}
                />
              </div>
            </div>

            <NodeDetail node={selected} allNodes={nodes} onSelect={setSelectedId} />
          </div>

          {/* Höger-kolumn */}
          <div className="space-y-4">
            <Pipeline items={pipeline} />
            <QuickAccess nodes={nodes} onSelect={setSelectedId} />
          </div>
        </main>
      </div>

      <AddContentModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ChatDock />
    </div>
  );
}
