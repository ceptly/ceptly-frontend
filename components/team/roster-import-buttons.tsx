"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

import {
  importRosterFromJiraAction,
  importRosterFromLinearAction,
  importRosterFromMondayAction,
  importRosterFromClickUpAction,
  importRosterFromSlackAction,
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
  clickupConnected: boolean;
}

export function RosterImportButtons({
  workspaceId,
  slackConnected,
  linearConnected,
  jiraConnected,
  mondayConnected,
  clickupConnected,
}: RosterImportButtonsProps) {
  const { resolvedTheme, theme } = useTheme();
  const logoTheme = (resolvedTheme ?? theme) === "dark" ? "dark" : "light";
  const slackLogo = getIntegrationLogo("slack", logoTheme);
  const linearLogo = getIntegrationLogo("linear", logoTheme);
  const jiraLogo = getIntegrationLogo("jira", logoTheme);
  const mondayLogo = getIntegrationLogo("monday", logoTheme);
  const clickupLogo = getIntegrationLogo("clickup", logoTheme);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSlackPending, startSlackTransition] = useTransition();
  const [isLinearPending, startLinearTransition] = useTransition();
  const [isJiraPending, startJiraTransition] = useTransition();
  const [isMondayPending, startMondayTransition] = useTransition();
  const [isClickUpPending, startClickUpTransition] = useTransition();

  const importDisabled =
    isSlackPending ||
    isLinearPending ||
    isJiraPending ||
    isMondayPending ||
    isClickUpPending;

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

  const handleClickUpImport = () => {
    setMessage(null);
    setError(null);
    startClickUpTransition(async () => {
      const result = await importRosterFromClickUpAction(workspaceId);
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
        {slackConnected ? (
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
        )}

        {linearConnected ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleLinearImport}
            disabled={!slackConnected || importDisabled}
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
            disabled={!slackConnected || importDisabled}
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
            disabled={!slackConnected || importDisabled}
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

        {clickupConnected ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleClickUpImport}
            disabled={!slackConnected || importDisabled}
          >
            {isClickUpPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : clickupLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clickupLogo}
                alt=""
                className="mr-2 size-4 rounded-sm object-contain"
              />
            ) : null}
            Import from ClickUp
          </Button>
        ) : (
          <Link
            href="/settings/integrations/clickup"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Connect ClickUp
          </Link>
        )}
      </div>

      {!slackConnected ? (
        <p className="text-xs text-muted-foreground">
          Connect Slack to import your team and send check-in DMs.
        </p>
      ) : linearConnected || jiraConnected || mondayConnected || clickupConnected ? (
        <p className="text-xs text-muted-foreground">
          Tracker imports add members who match a Slack account by email.
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
