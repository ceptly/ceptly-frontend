"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, Unplug } from "lucide-react";

import {
  disconnectMondayConnection,
  fetchMondayInstallUrl,
} from "@/actions/monday";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MondayConnectionStatus } from "@/lib/api/monday";
import { cn } from "@/lib/utils";

interface MondayIntegrationPanelProps {
  workspaceId: string;
  canEdit: boolean;
  status: MondayConnectionStatus;
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

export function MondayIntegrationPanel({
  workspaceId,
  canEdit,
  status,
  description,
  showConnectedAlert = false,
  showErrorAlert = false,
}: MondayIntegrationPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, startDisconnectTransition] = useTransition();

  const connectedLabel = formatConnectedDate(status.connectedAt);
  const accountName = status.accountName ?? status.accountSlug ?? "Monday.com";

  const connectedHint = status.connected
    ? "Meeting agents can link items and update status when your team says they finished or started work."
    : null;

  const handleConnect = () => {
    setError(null);
    startTransition(async () => {
      const result = await fetchMondayInstallUrl(
        workspaceId,
        "/settings/integrations/monday",
      );
      if (result.error || !result.url) {
        setError(result.error ?? "Failed to start Monday.com authorization.");
        return;
      }
      window.location.href = result.url;
    });
  };

  const handleDisconnect = () => {
    setError(null);
    startDisconnectTransition(async () => {
      const result = await disconnectMondayConnection(workspaceId);
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
            Monday.com connected successfully. Team insights chat can now
            reference assigned items alongside conversation responses.
          </AlertDescription>
        </Alert>
      ) : null}

      {showErrorAlert ? (
        <Alert variant="destructive">
          <AlertDescription>
            Monday.com connection failed. Please try again.
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
          <h2 className="text-sm font-semibold">Connected accounts</h2>
          <div className="rounded-lg border border-border bg-card dark:border-white/10">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">{accountName}</p>
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
                      Disconnect {accountName}
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
            Authorize Ceptly to read Monday.com boards so chat can answer
            questions about what your team is working on.
          </p>
          <Button type="button" onClick={handleConnect} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Connect Monday.com"
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Monday.com is not connected. Ask a workspace owner or admin to connect
          Monday.com for your team.
        </p>
      )}
    </div>
  );
}
