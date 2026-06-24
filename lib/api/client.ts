/**
 * Shared fetch client for the backend API modules in `lib/api/`.
 *
 * Every module here was repeating the same ~20 lines per endpoint: resolve the
 * base URL, attach the bearer token, JSON-encode the body, parse the envelope,
 * and map a thrown fetch (backend down) to a friendly failed result. `apiFetch`
 * collapses that to a single call so each endpoint is a one-liner.
 *
 * The backend always responds with `{ success, error?, data? }`; `TData` is the
 * shape of `data` for the endpoint.
 */
import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

export type ApiResult<T> = {
  success: boolean;
  error?: string;
  data?: T;
};

/** Returned when the fetch itself throws (backend unreachable, DNS, CORS). */
const NETWORK_ERROR = "Could not reach the API. Is the backend running?";

export interface ApiFetchOptions {
  /** Bearer token. Omit for unauthenticated endpoints. */
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON-serialized as the request body; also sets the Content-Type header. */
  body?: unknown;
  /**
   * Fetch cache mode. Defaults to "no-store" for GET (the existing behavior of
   * every read in `lib/api/`) and the fetch default otherwise.
   */
  cache?: RequestCache;
}

export async function apiFetch<TData = never>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResult<TData>> {
  const { token, method = "GET", body, cache } = options;

  try {
    const base = await resolveApiBaseUrl();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: cache ?? (method === "GET" ? "no-store" : undefined),
    });

    return parseJsonResponse<{ data?: TData }>(response);
  } catch {
    return { success: false, error: NETWORK_ERROR };
  }
}
