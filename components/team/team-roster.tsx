"use client";

import { useActionState, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Ellipsis, Pause, Play, Trash2 } from "lucide-react";

import {
  addRosterMemberAction,
  removeRosterMemberAction,
  toggleRosterMemberPaused,
  updateRosterMemberLocale,
} from "@/actions/roster";
import { RosterDataTable } from "@/components/team/roster-data-table";
import { RosterImportButtons } from "@/components/team/roster-import-buttons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RosterMember } from "@/lib/api/roster";
import { getLanguageLabel, SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";
import {
  getTimezoneLabel,
  groupTimezonesByRegion,
  TIMEZONE_OPTIONS,
} from "@/lib/schedule/timezones";

const selectClassName =
  "flex h-9 w-full min-w-[9rem] rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface TeamRosterProps {
  workspaceId: string;
  workspaceTimezone: string;
  workspaceLanguage: string;
  canEdit: boolean;
  slackConnected: boolean;
  linearConnected: boolean;
  jiraConnected: boolean;
  mondayConnected: boolean;
  clickupConnected: boolean;
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
  clickupConnected,
  members,
}: TeamRosterProps) {
  const [addState, addAction, addPending] = useActionState(
    addRosterMemberAction,
    {},
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const timezoneGroups = groupTimezonesByRegion();

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

  const handleTimezoneChange = (member: RosterMember, value: string) => {
    setActionError(null);
    const timezone = value === workspaceTimezone ? null : value;
    if (timezone === member.timezone) {
      return;
    }

    startTransition(async () => {
      const result = await updateRosterMemberLocale(workspaceId, member.id, {
        timezone,
      });
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const handleLanguageChange = (member: RosterMember, value: string) => {
    setActionError(null);
    const language = value === workspaceLanguage ? null : value;
    if (language === member.language) {
      return;
    }

    startTransition(async () => {
      const result = await updateRosterMemberLocale(workspaceId, member.id, {
        language,
      });
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const columns: ColumnDef<RosterMember>[] = [
    {
      accessorKey: "display_name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("display_name")}</span>
      ),
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
      cell: ({ row }) => {
        const member = row.original;
        const effective = member.effective_timezone;

        if (!canEdit) {
          return (
            <span className="text-muted-foreground">
              {getTimezoneLabel(effective)}
            </span>
          );
        }

        const hasEffectiveInList = TIMEZONE_OPTIONS.some(
          (timezone) => timezone.value === effective,
        );

        return (
          <select
            aria-label={`Timezone for ${member.display_name}`}
            className={selectClassName}
            value={effective}
            disabled={isPending || !slackConnected}
            onChange={(event) =>
              handleTimezoneChange(member, event.target.value)
            }
          >
            {!hasEffectiveInList ? (
              <option value={effective}>{getTimezoneLabel(effective)}</option>
            ) : null}
            {Object.entries(timezoneGroups).map(([region, options]) => (
              <optgroup key={region} label={region}>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        );
      },
    },
    {
      id: "language",
      header: "Language",
      cell: ({ row }) => {
        const member = row.original;
        const effective = member.effective_language;

        if (!canEdit) {
          return (
            <span className="text-muted-foreground">
              {getLanguageLabel(effective)}
            </span>
          );
        }

        const hasEffectiveInList = SUPPORTED_LANGUAGES.some(
          (language) => language.code === effective,
        );

        return (
          <select
            aria-label={`Language for ${member.display_name}`}
            className={selectClassName}
            value={effective}
            disabled={isPending || !slackConnected}
            onChange={(event) =>
              handleLanguageChange(member, event.target.value)
            }
          >
            {!hasEffectiveInList ? (
              <option value={effective}>{getLanguageLabel(effective)}</option>
            ) : null}
            {SUPPORTED_LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      id: "data_sources",
      header: "Apps",
      cell: ({ row }) => {
        const sources = row.original.data_sources ?? [];

        if (sources.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {sources.includes("slack") ? (
              <Badge variant="secondary">Slack</Badge>
            ) : null}
            {sources.includes("linear") ? (
              <Badge variant="secondary">Linear</Badge>
            ) : null}
            {sources.includes("jira") ? (
              <Badge variant="secondary">Jira</Badge>
            ) : null}
            {sources.includes("monday") ? (
              <Badge variant="secondary">Monday</Badge>
            ) : null}
            {sources.includes("clickup") ? (
              <Badge variant="secondary">ClickUp</Badge>
            ) : null}
          </div>
        );
      },
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
                          disabled={isPending || !slackConnected}
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleTogglePaused(member)}
                      >
                        {member.paused ? <Play /> : <Pause />}
                        {member.paused ? "Resume check-ins" : "Pause check-ins"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
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
      {!slackConnected ? (
        <Alert>
          <AlertDescription>
            Connect Slack in team settings before adding members to the roster.
          </AlertDescription>
        </Alert>
      ) : slackConnected && members.length === 0 ? (
        <Alert>
          <AlertDescription>
            Add team members to receive check-ins.
          </AlertDescription>
        </Alert>
      ) : null}

      {(linearConnected ||
        jiraConnected ||
        mondayConnected ||
        clickupConnected) &&
        members.some(
          (member) =>
            (linearConnected && !member.data_sources?.includes("linear")) ||
            (jiraConnected && !member.data_sources?.includes("jira")) ||
            (mondayConnected && !member.data_sources?.includes("monday")) ||
            (clickupConnected && !member.data_sources?.includes("clickup")),
        ) ? (
        <Alert>
          <AlertDescription>
            Some roster emails may not match a connected issue tracker account.
            Check the Apps column — members without a Linear, Jira, Monday, or
            ClickUp badge need the same email in Slack and your tracker.
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
        <RosterImportButtons
          workspaceId={workspaceId}
          slackConnected={slackConnected}
          linearConnected={linearConnected}
          jiraConnected={jiraConnected}
          mondayConnected={mondayConnected}
          clickupConnected={clickupConnected}
        />
      ) : null}

      <RosterDataTable columns={columns} data={members} />

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
              Must match a Slack account in your connected team.
            </p>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only workspace owners, admins, and members can manage the team roster.
        </p>
      )}
    </div>
  );
}
