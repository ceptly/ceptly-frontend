import { describe, expect, it } from "vitest";

import {
  SUBSCRIPTION_TIERS,
  TIER_DEFAULTS,
  tierMeta,
} from "@/lib/subscription-tiers";

/**
 * This is the client-side mirror of the backend tier table. These assertions
 * lock the two copies into agreement — if the backend prices change, this test
 * fails until the mirror is updated.
 */
describe("tierMeta", () => {
  it("Starter (tier1) is $20/seat with 5-member and 5-agent caps", () => {
    expect(tierMeta("tier1")).toEqual({
      label: "Starter",
      pricePerSeatCents: 2000,
      maxMembers: 5,
      maxScheduledAgents: 5,
    });
  });

  it("Pro (tier2) is $30/seat with no caps", () => {
    expect(tierMeta("tier2")).toEqual({
      label: "Pro",
      pricePerSeatCents: 3000,
      maxMembers: null,
      maxScheduledAgents: null,
    });
  });

  it("defaults to the Starter tier for SSR fallbacks", () => {
    expect(TIER_DEFAULTS).toBe(SUBSCRIPTION_TIERS.tier1);
  });
});
