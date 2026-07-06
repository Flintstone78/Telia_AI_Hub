export type BriefDoc = {
  produkt?: string;
  bakgrund?: string;
  mal?: string;
  malgrupp?: string;
  insikt?: string;
  budskap?: string;
  omvarld?: string;
  kanaler?: string;
  leverabler?: string;
  tidplan?: string;
  budget?: string;
};

export const BRIEF_SECTIONS: Array<{ key: keyof BriefDoc; label: string }> = [
  { key: "produkt", label: "Produkt / tjänst" },
  { key: "bakgrund", label: "Bakgrund" },
  { key: "mal", label: "Mål" },
  { key: "malgrupp", label: "Målgrupp" },
  { key: "insikt", label: "Insikt" },
  { key: "budskap", label: "Budskap" },
  { key: "omvarld", label: "Omvärld & konkurrens" },
  { key: "kanaler", label: "Kanaler" },
  { key: "leverabler", label: "Leverabler" },
  { key: "tidplan", label: "Tidplan" },
  { key: "budget", label: "Budget" },
];
