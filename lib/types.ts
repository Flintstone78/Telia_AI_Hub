export type NodeStatus = "live" | "beta" | "idea";

export type Node = {
  id: string;
  name: string;
  description: string;
  status: NodeStatus;
  url?: string;
  tags?: string[];
  updatedAt?: string; // ISO-datum, t.ex. "2026-06-28"
  connections?: string[]; // id:n på andra noder
};

export type PipelineItem = {
  date: string; // ISO-datum, t.ex. "2026-07-15"
  title: string;
  description?: string;
  tag: string;
};
