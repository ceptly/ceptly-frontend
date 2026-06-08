import {
  Calendar,
  Compass,
  Layers,
  type LucideIcon,
  MessageSquare,
  Paperclip,
  Radio,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

/**
 * Display metadata for the Company Context "Brain" page. The backend owns the
 * editable field values + completeness; this config supplies the per-category
 * labels/icons/descriptions and which Ceptly agents each category powers
 * (mirrors the design's CX_CATEGORIES / CX_AGENTS in ContextData.jsx).
 */

export interface ContextAgentMeta {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const CX_AGENTS: Record<string, ContextAgentMeta> = {
  insights: { id: "insights", label: "Team insights", icon: Sparkles },
  checkins: { id: "checkins", label: "Check-ins", icon: MessageSquare },
  reachout: { id: "reachout", label: "Reach out", icon: Send },
  standups: { id: "standups", label: "Channel standups", icon: Radio },
  scheduling: { id: "scheduling", label: "Scheduling", icon: Calendar },
};

export const CX_AGENT_ORDER = [
  "insights",
  "checkins",
  "reachout",
  "standups",
  "scheduling",
];

export interface ContextCategoryMeta {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  unlocks: string;
  agents: string[];
  /** Brain bento span class. */
  span: string;
}

export const CX_CATEGORY_META: ContextCategoryMeta[] = [
  {
    id: "overview",
    label: "Company overview",
    icon: Compass,
    desc: "What the company does, who it's for, and how the team works.",
    unlocks:
      "Grounds every answer in what the company actually does — replies stop sounding generic.",
    agents: ["insights", "checkins", "reachout"],
    span: "md:col-span-3",
  },
  {
    id: "goals",
    label: "Goals & OKRs",
    icon: Target,
    desc: "Current quarter objectives and the results that define them.",
    unlocks:
      "Check-ins and rollups can flag work that drifts away from this quarter's priorities.",
    agents: ["insights", "checkins", "scheduling"],
    span: "md:col-span-3",
  },
  {
    id: "team",
    label: "Team & who-does-what",
    icon: Users,
    desc: "People, roles, and the squads they belong to.",
    unlocks:
      "Route reach-outs to the right person and read morale by squad, not just by individual.",
    agents: ["reachout", "checkins", "insights"],
    span: "md:col-span-2",
  },
  {
    id: "tools",
    label: "Tools & where work lives",
    icon: Layers,
    desc: "The systems your team uses and what each is for.",
    unlocks:
      "Link blockers to the right Linear issue and point teammates at the right doc automatically.",
    agents: ["checkins", "reachout", "standups"],
    span: "md:col-span-2",
  },
  {
    id: "docs",
    label: "Documents & links",
    icon: Paperclip,
    desc: "Source material Ceptly can read and cite.",
    unlocks: "Answer with citations from your own handbook, roadmap, and specs.",
    agents: ["insights", "reachout"],
    span: "md:col-span-2",
  },
];

export function getCategoryMeta(id: string): ContextCategoryMeta | undefined {
  return CX_CATEGORY_META.find((c) => c.id === id);
}
