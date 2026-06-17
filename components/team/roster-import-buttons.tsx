"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

import {
  importRosterFromJiraAction,
  importRosterFromLinearAction,
  importRosterFromMondayAction,
  importRosterFromSlackAction,
  importRosterFromTeamsAction,
} from "@/actions/roster";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { getIntegrationLogo } from "@/lib/integrations/logos";
import { cn } from "@/lib/utils";

interface RosterImportButtonsProps {
  workspaceId: string;
  slackConnected: boolean;
  linearConnected: boolean;
  jiraConnected: boolean;
  mondayConnected: boolean;
  teamsConnected: boolean;
  communicationPlatform?: "slack" | "teams";
}

export function RosterImportButtons({
  workspaceId,
  slackConnected,
  linearConnected,
  jiraConnected,
  mondayConnected,
  teamsConnected,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  communicationPlatform: _communicationPlatform = "slack",
}: RosterImportButtonsProps) {
  // MS Teams integration temporarily disabled — use `communicationPlatform === "teams"` to re-enable.
  const teamsPrimary = false;
  const primaryConnected = teamsPrimary ? teamsConnected : slackConnected;
  const { resolvedTheme, theme } = useTheme();
  const logoTheme = (resolvedTheme ?? theme) === "dark" ? "dark" : "light";
  const slackLogo = getIntegrationLogo("slack", logoTheme);
  const linearLogo = getIntegrationLogo("linear", logoTheme);
  const jiraLogo = getIntegrationLogo("jira", logoTheme);
  const mondayLogo = getIntegrationLogo("monday", logoTheme);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _teamsLogo = getIntegrationLogo("teams", logoTheme);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSlackPending, startSlackTransition] = useTransition();
  const [isLinearPending, startLinearTransition] = useTransition();
  const [isJiraPending, startJiraTransition] = useTransition();
  const [isMondayPending, startMondayTransition] = useTransition();
  const [isTeamsPending, startTeamsTransition] = useTransition();

  const importDisabled =
    isSlackPending ||
    isLinearPending ||
    isJiraPending ||
    isMondayPending ||
    isTeamsPending;

  const handleSlackImport = () => {
    setMessage(null);
    setError(null);
    startSlackTransition(async () => {
      const result = await importRosterFromSlackAction(workspaceId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Import complete.");
    });
  };

  const handleLinearImport = () => {
    setMessage(null);
    setError(null);
    startLinearTransition(async () => {
      const result = await importRosterFromLinearAction(workspaceId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Import complete.");
    });
  };

  const handleJiraImport = () => {
    setMessage(null);
    setError(null);
    startJiraTransition(async () => {
      const result = await importRosterFromJiraAction(workspaceId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Import complete.");
    });
  };

  const handleMondayImport = () => {
    setMessage(null);
    setError(null);
    startMondayTransition(async () => {
      const result = await importRosterFromMondayAction(workspaceId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Import complete.");
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTeamsImport = () => {
    setMessage(null);
    setError(null);
    startTeamsTransition(async () => {
      const result = await importRosterFromTeamsAction(workspaceId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Import complete.");
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* MS Teams integration temporarily disabled — uncomment to re-enable.
        {teamsPrimary ? (
          teamsConnected ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleTeamsImport}
              disabled={importDisabled}
            >
              {isTeamsPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : teamsLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teamsLogo}
                  alt=""
                  className="mr-2 size-4 rounded-sm object-contain"
                />
              ) : null}
              Import from Microsoft Teams
            </Button>
          ) : (
            <Link
              href="/settings/integrations/teams"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Connect Microsoft Teams
            </Link>
          )
        ) : null}
        */}

        {!teamsPrimary &&
          (slackConnected ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleSlackImport}
              disabled={importDisabled}
            >
              {isSlackPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : slackLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slackLogo}
                  alt=""
                  className="mr-2 size-4 rounded-sm object-contain"
                />
              ) : null}
              Import from Slack
            </Button>
          ) : (
            <Link
              href="/settings/integrations/slack"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Connect Slack
            </Link>
          ))}

        {linearConnected ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleLinearImport}
            disabled={!primaryConnected || importDisabled}
          >
            {isLinearPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : linearLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={linearLogo}
                alt=""
                className="mr-2 size-4 rounded-sm object-contain"
              />
            ) : null}
            Import from Linear
          </Button>
        ) : (
          <Link
            href="/settings/integrations/linear"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Connect Linear
          </Link>
        )}

        {jiraConnected ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleJiraImport}
            disabled={!primaryConnected || importDisabled}
          >
            {isJiraPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : jiraLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={jiraLogo}
                alt=""
                className="mr-2 size-4 rounded-sm object-contain"
              />
            ) : null}
            Import from Jira
          </Button>
        ) : (
          <Link
            href="/settings/integrations/jira"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Connect Jira
          </Link>
        )}

        {mondayConnected ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleMondayImport}
            disabled={!primaryConnected || importDisabled}
          >
            {isMondayPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : mondayLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mondayLogo}
                alt=""
                className="mr-2 size-4 rounded-sm object-contain"
              />
            ) : null}
            Import from Monday
          </Button>
        ) : (
          <Link
            href="/settings/integrations/monday"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Connect Monday.com
          </Link>
        )}
      </div>

      {!primaryConnected ? (
        <p className="text-xs text-muted-foreground">
          {teamsPrimary
            ? "Connect Microsoft Teams to import your team."
            : "Connect Slack to import your team and send conversation DMs."}
        </p>
      ) : linearConnected || jiraConnected || mondayConnected ? (
        <p className="text-xs text-muted-foreground">
          {teamsPrimary
            ? "Tracker imports add members who match a Microsoft Teams account by email."
            : "Tracker imports add members who match a Slack account by email."}
        </p>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
