"use server";

import { redirect } from "next/navigation";

import { refreshSubscriptionCookiesAction } from "@/actions/sync-subscription";
import { createBillingCheckout, createBillingPortalSession } from "@/lib/api/billing";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { getPrimaryWorkspace } from "@/lib/subscription";

export async function startBillingCheckoutAction(): Promise<{ error?: string }> {
  const user = await requireAuth();
  const token = await getAccessToken();
  const workspace = getPrimaryWorkspace(user);

  if (!token || !workspace?.id) {
    return { error: "Workspace not found" };
  }

  const result = await createBillingCheckout(token, workspace.id);

  if (result.error || !result.url) {
    return { error: result.error ?? "Unable to start checkout" };
  }

  redirect(result.url);
}

export async function openBillingPortalAction(): Promise<{ error?: string }> {
  const user = await requireAuth();
  const token = await getAccessToken();
  const workspace = getPrimaryWorkspace(user);

  if (!token || !workspace?.id) {
    return { error: "Workspace not found" };
  }

  const result = await createBillingPortalSession(token, workspace.id);

  if (result.error || !result.url) {
    return { error: result.error ?? "Unable to open billing portal" };
  }

  redirect(result.url);
}

export { refreshSubscriptionCookiesAction };
