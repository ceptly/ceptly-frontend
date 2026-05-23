"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Pause, Play, Trash2 } from "lucide-react";

import {
  addRosterMemberAction,
  removeRosterMemberAction,
  toggleRosterMemberPaused,
} from "@/actions/roster";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RosterMember } from "@/lib/api/roster";

interface TeamRosterCardProps {
  workspaceId: string;
  canEdit: boolean;
  slackConnected: boolean;
  members: RosterMember[];
}

export function TeamRosterCard({
  workspaceId,
  canEdit,
  slackConnected,
  members,
}: TeamRosterCardProps) {
  const [addState, addAction, addPending] = useActionState(addRosterMemberAction, {});
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTogglePaused = (member: RosterMember) => {
    setActionError(null);
    startTransition(async () => {
      const result = await toggleRosterMemberPaused(
        workspaceId,
        member.id,
        !member.paused,
      );
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const handleRemove = (memberId: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await removeRosterMemberAction(workspaceId, memberId);
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  return (
    <Card className="dark:border-white/20">
      <CardHeader>
        <CardTitle>Team roster</CardTitle>
        <CardDescription>
          People on this list receive scheduled check-in DMs in Slack.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!slackConnected ? (
          <Alert>
            <AlertDescription>
              Connect Slack above before adding team members to the roster.
            </AlertDescription>
          </Alert>
        ) : slackConnected && members.length === 0 ? (
          <Alert>
            <AlertDescription>
              Add team members to receive check-ins.
            </AlertDescription>
          </Alert>
        ) : null}

        {addState.error ? (
          <Alert variant="destructive">
            <AlertDescription>{addState.error}</AlertDescription>
          </Alert>
        ) : null}

        {addState.success ? (
          <Alert>
            <AlertDescription>Team member added.</AlertDescription>
          </Alert>
        ) : null}

        {actionError ? (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        {members.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border dark:border-white/10">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.display_name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {member.paused ? (
                    <Badge variant="secondary">Paused</Badge>
                  ) : null}
                  {canEdit ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isPending || !slackConnected}
                        onClick={() => handleTogglePaused(member)}
                        aria-label={
                          member.paused
                            ? `Resume check-ins for ${member.display_name}`
                            : `Pause check-ins for ${member.display_name}`
                        }
                      >
                        {member.paused ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isPending || !slackConnected}
                        onClick={() => handleRemove(member.id)}
                        aria-label={`Remove ${member.display_name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No team members on the roster yet.
          </p>
        )}

        {canEdit ? (
          <form action={addAction} className="space-y-3">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <div className="space-y-2">
              <Label htmlFor="roster-email">Add by email</Label>
              <div className="flex gap-2">
                <Input
                  id="roster-email"
                  name="email"
                  type="email"
                  placeholder="teammate@company.com"
                  required
                  disabled={!slackConnected || addPending}
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={!slackConnected || addPending}
                >
                  {addPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must match a Slack account in your connected workspace.
              </p>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Only founders and admins can manage the team roster.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
