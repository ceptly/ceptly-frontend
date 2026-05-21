/**
 * Express backend auth contract (adjust paths here if your API differs).
 *
 * - GET  /auth/slack?redirect_uri=<app>/auth/callback  → 302 to Slack
 * - GET  /auth/slack/callback?code=&state=             → { token, user, workspace }
 * - GET  /auth/me                                      → { user, workspace } (Bearer or cookie)
 * - POST /auth/logout                                  → 204
 */
export const AUTH_ENDPOINTS = {
  slack: "/auth/slack",
  slackCallback: "/auth/slack/callback",
  me: "/auth/me",
  logout: "/auth/logout",
} as const;

export function getSlackAuthUrl(redirectUri: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const url = new URL(AUTH_ENDPOINTS.slack, base);
  url.searchParams.set("redirect_uri", redirectUri);
  return url.toString();
}

export function getAuthCallbackUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/auth/callback`;
}
