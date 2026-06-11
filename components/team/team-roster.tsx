"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Loader2,
  Ellipsis,
  Mail,
  MessageSquare,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";

import {
  addRosterMemberAction,
  removeRosterMemberAction,
  toggleRosterMemberPaused,
} from "@/actions/roster";
import { EditRosterMemberDialog } from "@/components/team/edit-roster-member-dialog";
import { RosterDataTable } from "@/components/team/roster-data-table";
import { RosterImportButtons } from "@/components/team/roster-import-buttons";
import {
  getRosterMemberInitials,
  RosterMemberApps,
} from "@/components/team/roster-member-apps";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { RosterMember } from "@/lib/api/roster";
import { getLanguageLabel } from "@/lib/i18n/languages";
import { getTimezoneLabel } from "@/lib/schedule/timezones";

interface TeamRosterProps {
  workspaceId: string;
  workspaceTimezone: string;
  workspaceLanguage: string;
  canEdit: boolean;
  slackConnected: boolean;
  linearConnected: boolean;
  jiraConnected: boolean;
  mondayConnected: boolean;
  teamsConnected: boolean;
  communicationPlatform: "slack" | "teams";
  members: RosterMember[];
}

export function TeamRoster({
  workspaceId,
  workspaceTimezone,
  workspaceLanguage,
  canEdit,
  slackConnected,
  linearConnected,
  jiraConnected,
  mondayConnected,
  teamsConnected,
  communicationPlatform,
  members,
}: TeamRosterProps) {
  const teamsPrimary = communicationPlatform === "teams";
  const primaryConnected = teamsPrimary ? teamsConnected : slackConnected;
  const [addState, addAction, addPending] = useActionState(
    addRosterMemberAction,
    {},
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<RosterMember | null>(null);
  const [isPending, startTransition] = useTransition();

  const primaryEmailHint = teamsPrimary
    ? "Must match a Microsoft Teams account in your connected organization."
    : "Must match a Slack account in your connected team.";

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

  const columns: ColumnDef<RosterMember>[] = [
    {
      accessorKey: "display_name",
      header: "Name",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <span className="flex items-center gap-2.5 font-semibold">
            <Avatar className="size-7 rounded-full">
              <AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
                {getRosterMemberInitials(member.display_name)}
              </AvatarFallback>
            </Avatar>
            {member.display_name}
            {member.paused ? (
              <Badge variant="outline" className="font-normal">
                Paused
              </Badge>
            ) : null}
          </span>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("email")}</span>
      ),
    },
    {
      id: "timezone",
      header: "Timezone",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {getTimezoneLabel(row.original.effective_timezone)}
        </span>
      ),
    },
    {
      id: "language",
      header: "Language",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {getLanguageLabel(row.original.effective_language)}
        </span>
      ),
    },
    {
      id: "data_sources",
      header: "Apps",
      cell: ({ row }) => (
        <RosterMemberApps sources={row.original.data_sources ?? []} />
      ),
    },
    ...(canEdit
      ? [
          {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }: { row: { original: RosterMember } }) => {
              const member = row.original;

              return (
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          disabled={isPending || !primaryConnected}
                          aria-label={`Actions for ${member.display_name}`}
                        />
                      }
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Ellipsis className="size-4" />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[170px] rounded-none p-1.5"
                    >
                      <DropdownMenuItem
                        className="gap-2.5 rounded-none px-2.5 py-2 text-[13px]"
                        render={<Link href="/chat" prefetch />}
                      >
                        <MessageSquare className="size-3.5 text-muted-foreground" />
                        Reach out in Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2.5 rounded-none px-2.5 py-2 text-[13px]"
                        onClick={() => setEditingMember(member)}
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                        Edit details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2.5 rounded-none px-2.5 py-2 text-[13px]"
                        onClick={() => handleTogglePaused(member)}
                      >
                        {member.paused ? <Play /> : <Pause />}
                        {member.paused ? "Resume check-ins" : "Pause check-ins"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        className="gap-2.5 rounded-none px-2.5 py-2 text-[13px]"
                        onClick={() => handleRemove(member.id)}
                      >
                        <Trash2 />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            },
          } satisfies ColumnDef<RosterMember>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {!primaryConnected ? (
        <Alert>
          <AlertDescription>
            {teamsPrimary
              ? "Connect Microsoft Teams in workspace settings before adding members to the roster."
              : "Connect Slack in workspace settings before adding members to the roster."}
          </AlertDescription>
        </Alert>
      ) : primaryConnected && members.length === 0 ? (
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

      {canEdit ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <RosterImportButtons
              workspaceId={workspaceId}
              slackConnected={slackConnected}
              linearConnected={linearConnected}
              jiraConnected={jiraConnected}
              mondayConnected={mondayConnected}
              teamsConnected={teamsConnected}
              communicationPlatform={communicationPlatform}
            />
          </div>
          <Badge variant="outline" className="shrink-0">
            {members.length} member{members.length === 1 ? "" : "s"}
          </Badge>
        </div>
      ) : null}

      <RosterDataTable columns={columns} data={members} />

      {canEdit ? (
        <form action={addAction} className="space-y-2">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[min(100%,16rem)] flex-1">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="roster-email"
                name="email"
                type="email"
                placeholder="teammate@company.com"
                className="pl-10"
                required
                disabled={!primaryConnected || addPending}
              />
            </div>
            <Button
              type="submit"
              disabled={!primaryConnected || addPending}
            >
              {addPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Add member"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{primaryEmailHint}</p>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only workspace owners, admins, and members can manage the team roster.
        </p>
      )}

      {(linearConnected || jiraConnected || mondayConnected) &&
      members.some(
        (member) =>
          (linearConnected && !member.data_sources?.includes("linear")) ||
          (jiraConnected && !member.data_sources?.includes("jira")) ||
          (mondayConnected && !member.data_sources?.includes("monday")),
      ) ? (
        <Alert>
          <AlertDescription>
            Some roster emails may not match a connected issue tracker account.
            Check the Apps column — members without a Linear, Jira, or Monday
            badge need the same email in Slack and your tracker.
          </AlertDescription>
        </Alert>
      ) : null}

      {editingMember ? (
        <EditRosterMemberDialog
          key={editingMember.id}
          member={editingMember}
          workspaceId={workspaceId}
          workspaceTimezone={workspaceTimezone}
          workspaceLanguage={workspaceLanguage}
          connectedIntegrations={{
            slack: slackConnected,
            linear: linearConnected,
            jira: jiraConnected,
            monday: mondayConnected,
            teams: teamsConnected,
          }}
          onClose={() => setEditingMember(null)}
          onSaved={() => setEditingMember(null)}
        />
      ) : null}
    </div>
  );
}
