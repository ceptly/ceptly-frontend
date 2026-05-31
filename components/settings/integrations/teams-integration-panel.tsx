"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, Unplug } from "lucide-react";

import {
  disconnectTeamsConnection,
  fetchTeamsInstallUrl,
} from "@/actions/teams";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamsConnectionStatus } from "@/lib/api/teams";
import { cn } from "@/lib/utils";

interface TeamsIntegrationPanelProps {
  workspaceId: string;
  canEdit: boolean;
  status: TeamsConnectionStatus;
  description: string;
  showConnectedAlert?: boolean;
  showErrorAlert?: boolean;
}

function formatConnectedDate(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }

  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function TeamsIntegrationPanel({
  workspaceId,
  canEdit,
  status,
  description,
  showConnectedAlert = false,
  showErrorAlert = false,
}: TeamsIntegrationPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, startDisconnectTransition] = useTransition();

  const connectedLabel = formatConnectedDate(status.connectedAt);
  const orgName = status.organizationName ?? "Microsoft Teams";

  const connectedHint = status.connected
    ? "Standup agents post check-ins and @mention teammates in Teams channels."
    : null;

  const handleConnect = () => {
    setError(null);
    startTransition(async () => {
      const result = await fetchTeamsInstallUrl(
        workspaceId,
        "/settings/integrations/teams",
      );
      if (result.error || !result.url) {
        setError(result.error ?? "Failed to start Microsoft Teams authorization.");
        return;
      }
      window.location.href = result.url;
    });
  };

  const handleDisconnect = () => {
    setError(null);
    startDisconnectTransition(async () => {
      const result = await disconnectTeamsConnection(workspaceId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{description}</p>

      {showConnectedAlert ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Microsoft Teams connected successfully. Standup agents can now post
            check-ins and @mention teammates in Teams channels.
          </AlertDescription>
        </Alert>
      ) : null}

      {showErrorAlert ? (
        <Alert variant="destructive">
          <AlertDescription>
            Microsoft Teams connection failed. Please try again.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {status.connected ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Connected organization</h2>
          <div className="rounded-lg border border-border bg-card dark:border-white/10">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">{orgName}</p>
                {connectedLabel ? (
                  <p className="text-sm text-muted-foreground">
                    Connected {connectedLabel}
                  </p>
                ) : null}
                {connectedHint ? (
                  <p className="text-sm text-muted-foreground">
                    {connectedHint}
                  </p>
                ) : null}
              </div>

              {canEdit ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-2"
                        disabled={isDisconnecting}
                      />
                    }
                  >
                    <span className="size-2 rounded-full bg-green-500" />
                    Connected
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Unplug />
                      )}
                      Disconnect {orgName}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm",
                  )}
                >
                  <span className="size-2 rounded-full bg-green-500" />
                  Connected
                </div>
              )}
            </div>
          </div>
        </div>
      ) : canEdit ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Authorize Ceptly to post standups and @mention teammates in Microsoft
            Teams channels. An Azure AD admin may need to grant consent for your
            organization.
          </p>
          <Button type="button" onClick={handleConnect} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Connect Microsoft Teams"
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Microsoft Teams is not connected. Ask a workspace owner or admin to
          connect Teams for your team.
        </p>
      )}
    </div>
  );
}
