import { NextResponse } from "next/server";

import { AUTH_ENDPOINTS, resolveApiBaseUrl } from "@/lib/api/auth";
import { getPostHogClient } from "@/lib/posthog-server";
import type { AuthSessionResponse } from "@/lib/api/types";
import { appRedirectUrl } from "@/lib/app-origin";
import {
  setAuthCookies,
  setOnboardingCompleteCookie,
  setSubscriptionCookies,
} from "@/lib/auth/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      appRedirectUrl("/auth?error=google_auth_failed"),
    );
  }

  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}${AUTH_ENDPOINTS.googleFinish}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );

    const result = (await response.json()) as AuthSessionResponse & {
      data?: {
        redirectPath?: string;
        onboardingCompleted?: boolean;
      };
    };

    if (!response.ok || !result.success || !result.data?.session) {
      const message = encodeURIComponent(result.error ?? "google_auth_failed");
      return NextResponse.redirect(appRedirectUrl(`/auth?error=${message}`));
    }

    await setAuthCookies(result.data.session);

    if (result.data.user) {
      await setSubscriptionCookies(result.data.user);
    }

    const posthog = getPostHogClient();
    const userId = result.data.user?.id ?? result.data.user?.email ?? "unknown";
    posthog.capture({
      distinctId: userId,
      event: "user_signed_in_with_google",
      properties: {
        email: result.data.user?.email,
        method: "google",
        is_new_user: !result.data.onboardingCompleted,
      },
    });
    if (result.data.user) {
      posthog.identify({
        distinctId: userId,
        properties: {
          email: result.data.user.email,
          name: result.data.user.fullName,
        },
      });
    }
    await posthog.shutdown();

    if (result.data.onboardingCompleted) {
      await setOnboardingCompleteCookie(true);
    } else {
      await setOnboardingCompleteCookie(false);
    }

    const redirectPath = result.data.redirectPath ?? "/chat";
    return NextResponse.redirect(appRedirectUrl(redirectPath));
  } catch {
    return NextResponse.redirect(
      appRedirectUrl("/auth?error=google_auth_failed"),
    );
  }
}
