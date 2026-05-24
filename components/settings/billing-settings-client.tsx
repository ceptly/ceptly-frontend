"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { openBillingPortalAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkspaceBillingStatus } from "@/lib/api/billing";
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
}: {
  initialStatus: WorkspaceBillingStatus;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManageBilling() {
    setPending(true);
    setError(null);

    try {
      const result = await openBillingPortalAction();
      if (result?.error) {
        setError(result.error);
        setPending(false);
      }
    } catch {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Manage your workspace subscription, payment method, and invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="font-medium">
              {formatSubscriptionStatus(initialStatus.subscriptionStatus)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Trial ends</dt>
            <dd className="font-medium">
              {formatDate(initialStatus.trialEndsAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Current period ends</dt>
            <dd className="font-medium">
              {formatDate(initialStatus.currentPeriodEnd)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Cancel at period end</dt>
            <dd className="font-medium">
              {initialStatus.cancelAtPeriodEnd ? "Yes" : "No"}
            </dd>
          </div>
        </dl>

        <Button
          type="button"
          onClick={() => void handleManageBilling()}
          disabled={pending || !initialStatus.hasActiveSubscription}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Opening portal…
            </>
          ) : (
            "Manage billing"
          )}
        </Button>

        {!initialStatus.hasActiveSubscription ? (
          <p className="text-sm text-muted-foreground">
            No active subscription yet. Go to{" "}
            <a href="/subscribe" className="font-medium text-foreground underline-offset-4 hover:underline">
              Start trial
            </a>{" "}
            to activate your workspace.
          </p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
