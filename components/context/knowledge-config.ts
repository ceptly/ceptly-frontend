import {
  BookOpen,
  Clipboard,
  Compass,
  FileText,
  Globe,
  Sparkles,
  Target,
  User,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type {
  ContextFactGroup,
  ContextFactSource,
  ContextSourceKind,
} from "@/lib/api/context";

export interface KnowledgeGroupMeta {
  id: ContextFactGroup;
  label: string;
  icon: LucideIcon;
  desc: string;
  /** Italic hint shown when the group has nothing learned yet. */
  ghost: string;
  /** Placeholder example for the add-a-fact composer. */
  example: string;
}

export const KN_GROUPS: KnowledgeGroupMeta[] = [
  {
    id: "people_ownership",
    label: "People & ownership",
    icon: Users,
    desc: "Who owns what — learned mostly from check-ins.",
    ghost: "As check-ins run, Ceptly notices who owns what and lists it here.",
    example: "“Dana handles all escalations.”",
  },
  {
    id: "priorities_goals",
    label: "Priorities & goals",
    icon: Target,
    desc: "What the team is driving at right now.",
    ghost:
      "Goals land here from leadership chat, synced projects, and the docs you add.",
    example: "“Billing ships before July 15.”",
  },
  {
    id: "product_customers",
    label: "Product & customers",
    icon: Compass,
    desc: "What the company builds, who pays, and the words customers use.",
    ghost: "Mostly extracted from your docs and website once you add them.",
    example: "“Customers call collectors pipelines.”",
  },
  {
    id: "team_workings",
    label: "How the team works",
    icon: Workflow,
    desc: "Norms, cadences, and the unwritten rules.",
    ghost: "Rituals and norms surface from Slack over time.",
    example: "“Releases ship Tuesdays.”",
  },
];

/** Icon or integration logo for a fact's provenance chip / source rows. */
export function sourceVisual(src: {
  kind: ContextFactSource["kind"] | ContextSourceKind;
}): { img?: string; icon?: LucideIcon } {
  switch (src.kind) {
    case "slack":
      return { img: "/integrations/slack.png" };
    case "doc":
    case "file":
      return { icon: FileText };
    case "website":
      return { icon: Globe };
    case "kb":
      return { icon: BookOpen };
    case "text":
      return { icon: Clipboard };
    case "user":
      return { icon: User };
    case "checkin":
    case "note":
      return { icon: Sparkles };
    default:
      return { icon: FileText };
  }
}

export function trackerLogo(
  tracker: "jira" | "linear" | "monday",
  theme: "light" | "dark" = "light",
): string {
  if (tracker === "jira") return "/integrations/Jira_icon.png";
  if (tracker === "monday") return "/integrations/monday.png";
  return theme === "light"
    ? "/integrations/linear-dark.png"
    : "/integrations/linear-light.png";
}

export const TRACKER_LABELS: Record<"jira" | "linear" | "monday", string> = {
  jira: "Jira",
  linear: "Linear",
  monday: "Monday",
};

/** "Jun 4" style chip date. */
export function chipDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "2h ago" style relative time for sync/scan meta. */
export function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const mins = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
