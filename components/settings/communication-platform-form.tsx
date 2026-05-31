"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { updateCommunicationPlatformAction } from "@/actions/communication";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { OptionSelector } from "@/components/ui/option-selector";
import type {
  CommunicationPlatform,
  CommunicationSettings,
} from "@/lib/api/communication";

interface CommunicationPlatformFormProps {
  workspaceId: string;
  initialSettings: CommunicationSettings;
  canEdit: boolean;
}

const PLATFORM_OPTIONS: {
  value: CommunicationPlatform;
  label: string;
  description: string;
}[] = [
  {
    value: "slack",
    label: "Slack",
    description: "Standups and @mentions run in Slack channels.",
  },
  {
    value: "clickup",
    label: "ClickUp",
    description: "Standups and @mentions run in ClickUp Chat channels.",
  },
  {
    value: "teams",
    label: "Microsoft Teams",
    description: "Standups and @mentions run in Microsoft Teams channels.",
  },
];

function connectedPlatformOptions(settings: CommunicationSettings) {
  return PLATFORM_OPTIONS.filter((option) => {
    if (option.value === "slack") {
      return settings.slack_connected;
    }
    if (option.value === "clickup") {
      return settings.clickup_connected;
    }
    return settings.teams_connected;
  });
}

export function CommunicationPlatformForm({
  workspaceId,
  initialSettings,
  canEdit,
}: CommunicationPlatformFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const availableOptions = useMemo(
    () => connectedPlatformOptions(settings),
    [settings],
  );
  const [platform, setPlatform] = useState<CommunicationPlatform>(() => {
    const options = connectedPlatformOptions(initialSettings);
    if (
      options.some((option) => option.value === initialSettings.communication_platform)
    ) {
      return initialSettings.communication_platform;
    }
    return options[0]?.value ?? initialSettings.communication_platform;
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const values = availableOptions.map((option) => option.value);
    if (values.length > 0 && !values.includes(platform)) {
      setPlatform(values[0]!);
    }
  }, [availableOptions, platform]);

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateCommunicationPlatformAction({
        workspaceId,
        platform,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.settings) {
        setSettings(result.settings);
        setSuccess("Communication platform updated.");
      }
    });
  };

  const dirty = platform !== settings.communication_platform;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication platform</CardTitle>
        <CardDescription>
          Where Ceptly posts standups, replies to @mentions, and delivers
          rollups. Each workspace uses exactly one platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Connect Slack, ClickUp, or Microsoft Teams in{" "}
            <Link
              href="/settings/integrations"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Integrations
            </Link>{" "}
            to choose a communication platform.
          </p>
        ) : (
          <div className="space-y-2">
            <Label>Platform</Label>
            <OptionSelector
              mode="single"
              value={platform}
              onChange={(value) => setPlatform(value as CommunicationPlatform)}
              options={availableOptions}
            />
          </div>
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {success ? (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        {canEdit && availableOptions.length > 0 ? (
          <Button
            type="button"
            onClick={handleSave}
            disabled={!dirty || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save platform"
            )}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Only workspace admins can change the communication platform.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
