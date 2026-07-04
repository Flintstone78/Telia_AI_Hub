"use client";

import { useEffect, useState } from "react";
import type { PipelineItem } from "@/lib/types";

export type LocalIdea = PipelineItem & { id: string };

const STORAGE_KEY = "navet-ideas";

/**
 * Idékön — poster du skriver in i Pipeline-panelen.
 * Sparas i webbläsarens localStorage (per enhet). Vill du göra en idé
 * permanent: flytta den till data/pipeline.ts och deploya.
 */
export function useLocalIdeas() {
  const [ideas, setIdeas] = useState<LocalIdea[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIdeas(JSON.parse(raw));
    } catch {
      // trasig data — börja om
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoaded(true);
  }, []);

  const persist = (next: LocalIdea[]) => {
    setIdeas(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage otillgängligt (t.ex. privat läge) — behåll i minnet
    }
  };

  const addIdea = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    persist([
      ...ideas,
      {
        id: `idea-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        title: trimmed,
        tag: "Idékö",
      },
    ]);
  };

  const removeIdea = (id: string) => {
    persist(ideas.filter((i) => i.id !== id));
  };

  return { ideas, addIdea, removeIdea, loaded };
}
