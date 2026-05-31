"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";

import { updateRosterMemberDetails } from "@/actions/roster";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RosterMemberApps } from "@/components/team/roster-member-apps";
import type { RosterMember } from "@/lib/api/roster";
import { getLanguageLabel, SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";
import { getIntegrationLogo } from "@/lib/integrations/logos";
import {
  getTimezoneLabel,
  groupTimezonesByRegion,
  TIMEZONE_OPTIONS,
} from "@/lib/schedule/timezones";
import { cn } from "@/lib/utils";

const selectBlockClassName =
  "h-[38px] w-full rounded-none border border-[color:var(--border-strong)] bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

const TRACKER_SOURCES = [
  "slack",
  "linear",
  "jira",
  "monday",
  "clickup",
  "teams",
] as const;

const TRACKER_LABELS: Record<(typeof TRACKER_SOURCES)[number], string> = {
  slack: "Slack",
  linear: "Linear",
  jira: "Jira",
  monday: "Monday",
  clickup: "ClickUp",
  teams: "Microsoft Teams",
};

interface EditRosterMemberDialogProps {
  member: RosterMember;
  workspaceId: string;
  workspaceTimezone: string;
  workspaceLanguage: string;
  connectedIntegrations: {
    slack: boolean;
    linear: boolean;
    jira: boolean;
    monday: boolean;
    clickup: boolean;
    teams: boolean;
  };
  onClose: () => void;
  onSaved: () => void;
}

export function EditRosterMemberDialog({
  member,
  workspaceId,
  workspaceTimezone,
  workspaceLanguage,
  connectedIntegrations,
  onClose,
  onSaved,
}: EditRosterMemberDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const logoTheme = (resolvedTheme ?? theme) === "dark" ? "dark" : "light";
  const timezoneGroups = groupTimezonesByRegion();

  const [displayName, setDisplayName] = useState(member.display_name);
  const [timezone, setTimezone] = useState(member.effective_timezone);
  const [language, setLanguage] = useState(member.effective_language);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const visibleTrackers = TRACKER_SOURCES.filter(
    (source) => connectedIntegrations[source],
  );

  function handleSave() {
    setError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }

    startTransition(async () => {
      const result = await updateRosterMemberDetails(workspaceId, member.id, {
        display_name: trimmedName,
        timezone: timezone === workspaceTimezone ? null : timezone,
        language: language === workspaceLanguage ? null : language,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onSaved();
      onClose();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="ceptly-modal"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-[family-name:var(--font-aldrich)] text-lg font-normal tracking-tight">
              Edit member
            </h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Update profile, timezone, language, and connected apps.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label="Close"
            disabled={isPending}
            onClick={onClose}
          >
            <X className="size-[18px]" />
          </Button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
          <Field>
            <FieldLabel htmlFor="roster-edit-name">Full name</FieldLabel>
            <Input
              id="roster-edit-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={isPending}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="roster-edit-email">Email</FieldLabel>
            <Input
              id="roster-edit-email"
              type="email"
              value={member.email}
              readOnly
              disabled
              className="opacity-80"
            />
            <FieldDescription>
              Must match a Slack account in your connected team.
            </FieldDescription>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="roster-edit-timezone">Timezone</FieldLabel>
              <select
                id="roster-edit-timezone"
                className={selectBlockClassName}
                value={timezone}
                disabled={isPending}
                onChange={(event) => setTimezone(event.target.value)}
              >
                {!TIMEZONE_OPTIONS.some(
                  (option) => option.value === timezone,
                ) ? (
                  <option value={timezone}>{getTimezoneLabel(timezone)}</option>
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
            </Field>

            <Field>
              <FieldLabel htmlFor="roster-edit-language">Language</FieldLabel>
              <select
                id="roster-edit-language"
                className={selectBlockClassName}
                value={language}
                disabled={isPending}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {!SUPPORTED_LANGUAGES.some(
                  (entry) => entry.code === language,
                ) ? (
                  <option value={language}>{getLanguageLabel(language)}</option>
                ) : null}
                {SUPPORTED_LANGUAGES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field>
            <FieldLabel>Connected apps</FieldLabel>
            <FieldDescription>
              Matched automatically from your integrations when emails align.
            </FieldDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {visibleTrackers.map((source) => {
                const active = member.data_sources?.includes(source) ?? false;
                const logo = getIntegrationLogo(source, logoTheme);

                return (
                  <span
                    key={source}
                    className={cn(
                      "inline-flex h-[30px] items-center gap-1.5 border px-3 text-[12.5px] font-medium",
                      active
                        ? "border-[color:var(--green-line)] bg-[color:var(--green-wash)] text-foreground"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {logo ? (
                      <Image
                        src={logo}
                        alt=""
                        width={14}
                        height={14}
                        className="size-3.5 object-contain"
                      />
                    ) : null}
                    {TRACKER_LABELS[source]}
                    {active ? <Check className="size-3 text-[color:var(--green-ink)]" /> : null}
                  </span>
                );
              })}
            </div>
            <div className="mt-3">
              <RosterMemberApps sources={member.data_sources ?? []} />
            </div>
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
