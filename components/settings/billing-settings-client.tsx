"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { openBillingPortalAction } from "@/actions/billing";
import { SeatManagement } from "@/components/settings/seat-management";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkspaceBillingStatus } from "@/lib/api/billing";
import { formatPricePerSeat } from "@/lib/api/billing";
import { formatSubscriptionStatus } from "@/lib/subscription";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function BillingSettingsClient({
  initialStatus,
  canManage,
  memberCount,
  pendingInviteCount,
  autoOpenManage = false,
}: {
  initialStatus: WorkspaceBillingStatus;
  canManage: boolean;
  memberCount: number;
  pendingInviteCount: number;
  autoOpenManage?: boolean;
}) {
  const [status] = useState(initialStatus);
  const [portalPending, setPortalPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceLabel = formatPricePerSeat(status.pricePerSeatCents);

  async function handleManageBilling() {
    setPortalPending(true);
    setError(null);

    try {
      const result = await openBillingPortalAction();
      if (result?.error) {
        setError(result.error);
        setPortalPending(false);
      }
    } catch {
      setPortalPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seats, payment method, invoices, and subscription status.
        </p>
      </div>

      <SeatManagement
        billing={status}
        canManage={canManage}
        memberCount={memberCount}
        pendingInviteCount={pendingInviteCount}
        autoOpenManage={autoOpenManage}
      />

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Per-seat plan at {priceLabel}/month per teammate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="font-medium">
                {formatSubscriptionStatus(status.subscriptionStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Seats in use</dt>
              <dd className="font-medium">
                {status.seatUsage} of {status.paidSeats}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Price per seat</dt>
              <dd className="font-medium">{priceLabel}/month</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Trial ends</dt>
              <dd className="font-medium">{formatDate(status.trialEndsAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Current period ends
              </dt>
              <dd className="font-medium">
                {formatDate(status.currentPeriodEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Cancel at period end
              </dt>
              <dd className="font-medium">
                {status.cancelAtPeriodEnd ? "Yes" : "No"}
              </dd>
            </div>
          </dl>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleManageBilling()}
            disabled={portalPending || !status.hasActiveSubscription}
          >
            {portalPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Opening portal…
              </>
            ) : (
              "Payment method & invoices"
            )}
          </Button>

          {!status.hasActiveSubscription ? (
            <p className="text-sm text-muted-foreground">
              No active subscription yet. Go to{" "}
              <a
                href="/subscribe"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Start trial
              </a>{" "}
              to activate your workspace.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
