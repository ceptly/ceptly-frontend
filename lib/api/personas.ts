import { apiFetch, type ApiResult } from "./client";

/** A persona preset from the backend registry (GET /api/personas). */
export interface PersonaOption {
  id: string;
  name: string;
  tagline: string;
  persona: string;
  goal: string;
  default_questions: string[];
  suggested_context_integrations: string[];
  /** Deploy surfaces this persona supports; older backends omit it (= both). */
  surfaces?: ("dm" | "channel")[];
  /** "report" personas post a deterministic scheduled report, no conversation. */
  interaction_mode?: "conversational" | "report";
}

/** Surfaces a persona supports, treating missing data as "both". */
export function personaSurfaces(persona: PersonaOption): ("dm" | "channel")[] {
  return persona.surfaces?.length ? persona.surfaces : ["dm", "channel"];
}

/** Shown if the personas API is unreachable so the deploy form still works. */
export const FALLBACK_PERSONAS: PersonaOption[] = [
  {
    id: "scrum_master",
    name: "Scrum Master",
    tagline: "Runs async meetings — progress, blockers, and task updates.",
    persona: "",
    goal: "",
    default_questions: [],
    suggested_context_integrations: [],
    surfaces: ["dm", "channel"],
    interaction_mode: "conversational",
  },
];

export function listPersonas(
  accessToken: string,
): Promise<ApiResult<{ personas: PersonaOption[] }>> {
  return apiFetch(`/api/personas`, { token: accessToken });
}
