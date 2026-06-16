import type { SubscriptionTier } from "@/lib/api/billing";

/**
 * Client-side mirror of ceptly-backend/src/lib/subscription-tiers.ts. The
 * backend remains authoritative (its `WorkspaceBillingStatus` carries the live
 * limits + price); these values drive pre-subscription UI (the subscribe page)
 * and SSR fallbacks before that status loads. Keep the two in sync.
 */
export interface TierMeta {
  /** Marketing label shown in billing UI. */
  readonly label: string;
  /** Monthly price per seat, in cents. */
  readonly pricePerSeatCents: number;
  /** Max billable workspace seats. `null` = unlimited. */
  readonly maxMembers: number | null;
  /** Max simultaneously scheduled, enabled agents. `null` = unlimited. */
  readonly maxScheduledAgents: number | null;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierMeta> = {
  tier1: {
    label: "Starter",
    pricePerSeatCents: 2000,
    maxMembers: 5,
    maxScheduledAgents: 5,
  },
  tier2: {
    label: "Pro",
    pricePerSeatCents: 3000,
    maxMembers: null,
    maxScheduledAgents: null,
  },
};

export function tierMeta(tier: SubscriptionTier): TierMeta {
  return SUBSCRIPTION_TIERS[tier];
}

/** Starter limits — the SSR fallback before live billing status is available. */
export const TIER_DEFAULTS = SUBSCRIPTION_TIERS.tier1;
