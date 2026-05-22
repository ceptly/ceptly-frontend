export const AUTH_ENDPOINTS = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/auth/me",
  logout: "/api/auth/logout",
} as const;

let cachedServerApiBaseUrl: string | null = null;

/** Client-safe base URL (always the public/deployed API). */
export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return base.replace(/\/$/, "");
}

/**
 * Server-side base URL. Prefers API_URL when the local backend is reachable,
 * otherwise falls back to NEXT_PUBLIC_API_URL (e.g. Render).
 */
export async function resolveApiBaseUrl(): Promise<string> {
  if (cachedServerApiBaseUrl) {
    return cachedServerApiBaseUrl;
  }

  const publicUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const localUrl = process.env.API_URL?.replace(/\/$/, "");

  if (!publicUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  if (localUrl && localUrl !== publicUrl) {
    try {
      const response = await fetch(`${localUrl}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(800),
      });
      if (response.ok) {
        cachedServerApiBaseUrl = localUrl;
        return localUrl;
      }
    } catch {
      // Local backend unavailable — use deployed API.
    }
  }

  cachedServerApiBaseUrl = publicUrl;
  return publicUrl;
}
