/**
 * Shared response parsing for the backend API client modules in `lib/api/`.
 * The backend always returns JSON with a `success` flag; anything else
 * (HTML error pages, proxy errors) is normalized to a failed result.
 */
export async function parseJsonResponse<T>(
  response: Response,
): Promise<T & { success: boolean; error?: string }> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    // Rate-limit responses normally carry a JSON body with a friendly
    // message; this fallback covers proxies that strip it.
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? `${retryAfter} seconds`
          : "a moment";
      return {
        success: false,
        error: `Too many requests. Please wait ${wait} and try again.`,
      } as T & { success: boolean; error?: string };
    }
    return {
      success: false,
      error: `Unexpected response (HTTP ${response.status}).`,
    } as T & { success: boolean; error?: string };
  }

  return (await response.json()) as T & { success: boolean; error?: string };
}
