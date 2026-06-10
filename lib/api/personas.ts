import { resolveApiBaseUrl } from "./auth";

/** A persona preset from the backend registry (GET /api/personas). */
export interface PersonaOption {
  id: string;
  name: string;
  tagline: string;
  dm: { persona: string; goal: string };
  channel: { persona: string; goal: string };
  default_questions: string[];
  suggested_context_integrations: string[];
}

/** Shown if the personas API is unreachable so the deploy form still works. */
export const FALLBACK_PERSONAS: PersonaOption[] = [
  {
    id: "scrum_master",
    name: "Scrum Master",
    tagline: "Runs async standups — progress, blockers, and task updates.",
    dm: { persona: "", goal: "" },
    channel: { persona: "", goal: "" },
    default_questions: [],
    suggested_context_integrations: [],
  },
];

export async function listPersonas(accessToken: string): Promise<{
  success: boolean;
  error?: string;
  data?: { personas: PersonaOption[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}/api/personas`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return {
        success: false,
        error: `Unexpected response (HTTP ${response.status}).`,
      };
    }
    return (await response.json()) as {
      success: boolean;
      error?: string;
      data?: { personas: PersonaOption[] };
    };
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
