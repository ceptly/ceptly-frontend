"use client";

import { useState, useTransition } from "react";
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

const PLATFORM_OPTIONS = [
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
    description: "Coming soon — not yet available.",
    disabled: true,
  },
];

export function CommunicationPlatformForm({
  workspaceId,
  initialSettings,
  canEdit,
}: CommunicationPlatformFormProps) {
  const [platform, setPlatform] = useState<CommunicationPlatform>(
    initialSettings.communication_platform,
  );
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        <div className="space-y-2">
          <Label>Platform</Label>
          <OptionSelector
            mode="single"
            value={platform}
            onChange={(value) => setPlatform(value as CommunicationPlatform)}
            options={PLATFORM_OPTIONS}
          />
        </div>

        <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Slack:</span>{" "}
            {settings.slack_connected ? "Connected." : "Not connected — connect from Integrations before selecting."}
          </p>
          <p>
            <span className="font-medium text-foreground">ClickUp:</span>{" "}
            {settings.clickup_connected ? "Connected." : "Not connected — connect from Integrations before selecting."}
          </p>
        </div>

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

        {canEdit ? (
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
