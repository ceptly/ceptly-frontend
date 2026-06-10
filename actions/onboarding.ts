"use server";

import { redirect } from "next/navigation";

import { postOnboardingComplete } from "@/lib/api/onboarding";
import { getPostHogClient } from "@/lib/posthog-server";
import { getCurrentUser } from "@/lib/auth/server";
import type { OnboardingCompleteInput } from "@/lib/onboarding-schemas";
import {
  getAccessToken,
  setOnboardingCompleteCookie,
  setSubscriptionCookies,
  setWorkspaceNameCookie,
} from "@/lib/auth/server";
import { userNeedsSubscribe } from "@/lib/subscription";

export type OnboardingActionState = {
  error?: string;
};

export async function completeOnboarding(
  _state: OnboardingActionState,
  payload: OnboardingCompleteInput,
): Promise<OnboardingActionState> {
  const token = await getAccessToken();

  if (!token) {
    redirect("/auth");
  }

  try {
    const result = await postOnboardingComplete(token, payload);

    if (!result.success) {
      return { error: result.error ?? "Failed to complete onboarding." };
    }

    await setOnboardingCompleteCookie(true);
    await setWorkspaceNameCookie(payload.organizationName.trim());

    const user = await getCurrentUser();
    if (user) {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: user.id,
        event: "onboarding_completed",
        properties: {
          organization_name: payload.organizationName.trim(),
        },
      });
      await posthog.shutdown();
    }

    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (base) {
      const meResponse = await fetch(`${base}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (meResponse.ok) {
        const meResult = await meResponse.json();
        const user = meResult.data?.user;
        if (user) {
          await setSubscriptionCookies(user);
          if (userNeedsSubscribe(user)) {
            redirect("/subscribe");
          }
        }
      }
    }
  } catch {
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/chat");
}
