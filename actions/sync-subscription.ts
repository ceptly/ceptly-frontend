"use server";

import { AUTH_ENDPOINTS, resolveApiBaseUrl } from "@/lib/api/auth";
import type { AuthMeResponse } from "@/lib/api/types";
import {
  getAccessToken,
  setSubscriptionCookies,
} from "@/lib/auth/server";

export async function refreshSubscriptionCookiesAction(): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    return;
  }

  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}${AUTH_ENDPOINTS.me}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const result = (await response.json()) as AuthMeResponse;
    const user = result.data?.user;

    if (user) {
      await setSubscriptionCookies(user);
    }
  } catch {
    // Ignore refresh failures; webhook may still be processing.
  }
}
