import { BillingSettingsClient } from "@/components/settings/billing-settings-client";
import { fetchBillingStatus } from "@/lib/api/billing";
import { TIER_DEFAULTS } from "@/lib/subscription-tiers";
import { listInvites } from "@/lib/api/invites";
import { listWorkspaceMembers } from "@/lib/api/members";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { getPrimaryWorkspace } from "@/lib/subscription";
import { canManageBilling, roleCountsTowardSeats } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ manageSeats?: string }>;
}) {
  const { manageSeats } = await searchParams;
  const user = await requireAuth();
  const token = await getAccessToken();
  const workspace = getPrimaryWorkspace(user);

  if (!token || !workspace?.id) {
    redirect("/auth");
  }

  if (!canManageBilling(workspace.role)) {
    redirect("/settings");
  }

  const [status, membersResult, invitesResult] = await Promise.all([
    fetchBillingStatus(token, workspace.id),
    listWorkspaceMembers(token, workspace.id),
    listInvites(token, workspace.id),
  ]);

  const members = membersResult?.data?.members ?? [];
  const pendingInvites = invitesResult?.data?.invites ?? [];
  const seatMemberCount = members.filter((member) =>
    roleCountsTowardSeats(member.role),
  ).length;
  const seatInviteCount = pendingInvites.filter((invite) =>
    roleCountsTowardSeats(invite.role),
  ).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <BillingSettingsClient
        initialStatus={
          status ?? {
            subscriptionStatus: workspace.subscriptionStatus ?? "none",
            subscriptionTier: "tier1",
            tierLabel: TIER_DEFAULTS.label,
            maxMembers: TIER_DEFAULTS.maxMembers,
            maxScheduledAgents: TIER_DEFAULTS.maxScheduledAgents,
            trialEndsAt: workspace.trialEndsAt ?? null,
            currentPeriodEnd: workspace.currentPeriodEnd ?? null,
            cancelAtPeriodEnd: workspace.cancelAtPeriodEnd ?? false,
            hasActiveSubscription: workspace.hasActiveSubscription ?? false,
            seatUsage: 0,
            paidSeats: 0,
            seatsAvailable: 0,
            pricePerSeatCents: null,
          }
        }
        canManage
        memberCount={seatMemberCount}
        pendingInviteCount={seatInviteCount}
        autoOpenManage={manageSeats === "1"}
      />
    </div>
  );
}
