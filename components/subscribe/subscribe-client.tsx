"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import {
  startBillingCheckoutAction,
  refreshSubscriptionCookiesAction,
} from "@/actions/billing";
import { formatPricePerSeat, type SubscriptionTier } from "@/lib/api/billing";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

const baseFeatures = [
  "Conversational Slack meetings",
  "AI scheduling and team insights chat",
  "One-off Slack reach-out",
  "Linear, Jira & Monday integration",
  "Per-seat pricing for workspace owners and admins",
];

const plans: {
  tier: SubscriptionTier;
  name: string;
  price: string;
  highlight: boolean;
  features: string[];
}[] = [
  {
    tier: "tier1",
    name: SUBSCRIPTION_TIERS.tier1.label,
    price: formatPricePerSeat(SUBSCRIPTION_TIERS.tier1.pricePerSeatCents),
    highlight: false,
    features: [
      ...baseFeatures,
      `Up to ${SUBSCRIPTION_TIERS.tier1.maxMembers} workspace members`,
      `Up to ${SUBSCRIPTION_TIERS.tier1.maxScheduledAgents} scheduled agents running at once`,
    ],
  },
  {
    tier: "tier2",
    name: SUBSCRIPTION_TIERS.tier2.label,
    price: formatPricePerSeat(SUBSCRIPTION_TIERS.tier2.pricePerSeatCents),
    highlight: true,
    features: [
      ...baseFeatures,
      "Unlimited workspace members",
      "Unlimited scheduled agents",
    ],
  },
];

export function SubscribeClient() {
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("checkout");
  const [pendingTier, setPendingTier] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checkoutState === "success") {
      void refreshSubscriptionCookiesAction();
    }
  }, [checkoutState]);

  async function handleStartTrial(tier: SubscriptionTier) {
    setPendingTier(tier);
    setError(null);

    try {
      const result = await startBillingCheckoutAction(tier);
      if (result?.error) {
        setError(result.error);
        setPendingTier(null);
      }
    } catch {
      setPendingTier(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Start your free trial
        </h1>
        <p className="text-muted-foreground">
          Your 10-day free trial includes 1 billable seat. After that, pick the
          plan that fits your team. Members have full access without using a paid
          seat. No credit card required to start.
        </p>
        {checkoutState === "success" ? (
          <p className="rounded-lg border border-[#745ae6]/25 bg-[#f2eefe]/60 px-4 py-3 text-sm">
            Checkout complete. If access hasn&apos;t unlocked yet, wait a moment
            and refresh.
          </p>
        ) : null}
        {checkoutState === "canceled" ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Checkout canceled. You can start your trial whenever you&apos;re
            ready.
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.tier}
            className={`flex flex-col rounded-2xl border bg-card p-6 shadow-sm ${
              plan.highlight
                ? "border-[#745ae6] ring-1 ring-[#745ae6]/30"
                : "border-border"
            }`}
          >
            <div className="mb-6 text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {plan.name}
              </p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">
                {plan.price}
                <span className="text-lg font-medium text-muted-foreground">
                  /seat/month
                </span>
              </p>
            </div>

            <ul className="mb-6 flex-1 space-y-3">
              {plan.features.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#745ae6]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void handleStartTrial(plan.tier)}
              disabled={pendingTier !== null}
              className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-6 text-sm font-medium shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                plan.highlight
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border bg-background hover:bg-muted"
              }`}
            >
              {pendingTier === plan.tier ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Start free trial
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>
      {error ? (
        <p className="text-center text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
