"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  Clock,
  FlaskConical,
  Hash,
  Loader2,
  Rocket,
  Save,
  Send,
} from "lucide-react";

import {
  deployAgentAction,
  previewAgentAction,
  testAgentAction,
  updateAgentAction,
} from "@/actions/agents";
import { AgentDivider, AgentSection } from "@/components/agents/agent-section";
import { AgentDeployedDialog } from "@/components/agents/agent-deployed-dialog";
import { ChannelChipsPicker } from "@/components/agents/channel-chips-picker";
import { ConfigSummary } from "@/components/agents/config-summary";
import { RecipientChipsPicker } from "@/components/agents/recipient-chips-picker";
import { SlackPreview } from "@/components/agents/slack-preview";
import { TriggerScheduleSection } from "@/components/agents/trigger-schedule-section";
import { AppContextPicker } from "@/components/settings/app-context-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEPLOY_AGENT_TYPES,
  SCHEDULE_PRESETS,
  type AgentDeployInitialValues,
  type AgentEditTarget,
  type AgentTriggerMode,
  type DeployAgentType,
  type PersonaMode,
} from "@/lib/agents";
import {
  agentFieldHintClass,
  agentPillVariants,
  agentTypeCardVariants,
  agentTypeIconVariants,
} from "@/lib/agents-ui";
import type {
  AgentContextIntegration,
  AgentDeployBody,
} from "@/lib/api/agents";
import type {
  ChatChannel,
  CommunicationPlatform,
} from "@/lib/api/communication";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type {
  AppContextOption,
  ConversationTemplate,
  ScheduleFrequency,
  StandupStyle,
} from "@/lib/api/types";
import { buildResultDestinations } from "@/lib/result-destinations";
import { snapScheduleTimeToInterval } from "@/lib/schedule/cron-fire";
import {
  formatScheduleDaysPreview,
  formatScheduleTimePreview,
} from "@/lib/schedule/preview";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  checkin: CalendarClock,
  reachout: Send,
  standup: Hash,
} as const;

const STANDUP_CHANNEL_LABEL: Record<CommunicationPlatform, string> = {
  slack: "Slack channel",
  clickup: "ClickUp channel",
  teams: "Teams channel",
};

function defaultContextIntegrations(options: AppContextOption[]): string[] {
  const linear = options.find((item) => item.id === "linear");
  return linear?.selectable ? ["linear"] : [];
}

interface AgentDeployFieldsProps {
  workspaceId: string;
  workspaceTimezone: string;
  templates: ConversationTemplate[];
  rosterMembers: RosterMember[];
  appContextOptions: AppContextOption[];
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
  chatChannels: ChatChannel[];
  communicationPlatform: CommunicationPlatform;
  chatChannelsError?: string | null;
  /** Preselect an agent type, e.g. from /agents/new?type=standup. */
  initialType?: DeployAgentType;
  /** When set, the form edits an existing agent instead of deploying a new one. */
  editTarget?: AgentEditTarget;
  /** Prefill values for edit mode. */
  initialValues?: AgentDeployInitialValues;
  /** Where to go after a successful save / cancel in edit mode. */
  onCloseEdit?: () => void;
}

export function AgentDeployFields({
  workspaceId,
  workspaceTimezone,
  templates,
  rosterMembers,
  appContextOptions,
  slackChannels,
  slackChannelsError,
  chatChannels,
  communicationPlatform,
  chatChannelsError,
  initialType = "checkin",
  editTarget,
  initialValues,
  onCloseEdit,
}: AgentDeployFieldsProps) {
  const isEdit = Boolean(editTarget);
  const router = useRouter();
  const dailyStandup =
    templates.find((template) => template.id === "daily_standup") ??
    templates[0];

  const [type, setType] = useState<DeployAgentType>(
    initialValues?.type ?? initialType,
  );
  const [standupStyle, setStandupStyle] = useState<StandupStyle>(
    initialValues?.standupStyle ?? "broadcast",
  );
  const [standupChannelId, setStandupChannelId] = useState(
    initialValues?.standupChannelId ?? "",
  );
  const [personaMode, setPersonaMode] = useState<PersonaMode>(
    initialValues?.personaMode ?? "pretrained",
  );
  const [persona, setPersona] = useState(initialValues?.persona ?? "");
  const [goal, setGoal] = useState(initialValues?.goal ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [timezone, setTimezone] = useState(
    initialValues?.timezone ?? workspaceTimezone,
  );
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    initialValues?.frequency ?? "specific_days",
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialValues?.daysOfWeek ??
      SCHEDULE_PRESETS[0]?.days_of_week ?? [1, 2, 3, 4, 5],
  );
  const [timeLocal, setTimeLocal] = useState(
    initialValues?.timeLocal ?? "09:00",
  );
  const [triggerMode, setTriggerMode] = useState<AgentTriggerMode>(
    initialValues?.triggerMode ?? "schedule",
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialValues?.selectedMemberIds ?? [],
  );
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(
    initialValues?.selectedChannelIds ?? [],
  );
  const [selectedRosterDmIds, setSelectedRosterDmIds] = useState<string[]>(
    initialValues?.selectedRosterDmIds ?? [],
  );
  const [contextIntegrations, setContextIntegrations] = useState<string[]>(
    () =>
      initialValues?.contextIntegrations ??
      defaultContextIntegrations(appContextOptions),
  );

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();
  const [deployed, setDeployed] = useState<{
    name: string;
    detail: string;
  } | null>(null);
  const [toast, setToast] = useState<{ title: string; sub: string } | null>(
    null,
  );

  const [previewOpener, setPreviewOpener] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const isPretrained = personaMode === "pretrained";
  const isReachout = type === "reachout";
  const isStandup = type === "standup";
  const isManual = isReachout || triggerMode === "manual";
  const typeName =
    DEPLOY_AGENT_TYPES.find((t) => t.id === type)?.name ?? "Agent";

  const rollupChannels = useMemo<SlackChannel[]>(
    () => (isStandup ? chatChannels : slackChannels),
    [isStandup, slackChannels, chatChannels],
  );
  const rollupChannelsError = isStandup
    ? chatChannelsError
    : slackChannelsError;

  function selectPersonaMode(mode: PersonaMode) {
    setPersonaMode(mode);
    if (mode === "pretrained") {
      setPersona("");
      setGoal("");
    }
  }

  function buildDeploySchedule() {
    if (isManual) {
      return {
        timezone,
        frequency: "specific_days" as const,
        days_of_week: SCHEDULE_PRESETS[0]?.days_of_week ?? [1, 2, 3, 4, 5],
        time_local: "09:00",
        enabled: false,
      };
    }
    return {
      timezone,
      frequency,
      days_of_week: frequency === "daily" ? [0, 1, 2, 3, 4, 5, 6] : daysOfWeek,
      time_local: snapScheduleTimeToInterval(timeLocal),
      enabled: true,
    };
  }

  const isComplete = useMemo(() => {
    if (!name.trim()) return false;
    if (isStandup && !standupChannelId) return false;
    if (selectedMemberIds.length === 0) return false;
    if (!isManual && frequency === "specific_days" && daysOfWeek.length === 0) {
      return false;
    }
    return true;
  }, [
    name,
    isStandup,
    standupChannelId,
    selectedMemberIds,
    isManual,
    frequency,
    daysOfWeek,
  ]);

  function buildBody(): AgentDeployBody {
    const trimmedName = name.trim();
    return {
      kind: type,
      trigger_mode: isReachout ? "manual" : triggerMode,
      name: trimmedName,
      ...(isPretrained
        ? { persona_preset: "scrum_master" as const }
        : {
            agent_persona: persona.trim(),
            conversation_goal: goal.trim(),
          }),
      agent_notes: notes.trim() || undefined,
      intent: "gather",
      roster_member_ids: selectedMemberIds,
      context_integrations: contextIntegrations as AgentContextIntegration[],
      result_destinations: buildResultDestinations({
        channelIds: selectedChannelIds,
        channels: rollupChannels,
        rosterDmIds: selectedRosterDmIds,
      }),
      schedule: buildDeploySchedule(),
      ...(isStandup
        ? { channel_id: standupChannelId, style: standupStyle }
        : { template_id: dailyStandup?.id }),
      ...(isReachout
        ? { topic: (goal.trim() || trimmedName).slice(0, 200) }
        : {}),
    };
  }

  // ---- live preview: generate once all required fields are complete ----
  const previewSeq = useRef(0);
  useEffect(() => {
    if (!isComplete) return;
    const seq = ++previewSeq.current;
    const handle = setTimeout(async () => {
      setPreviewLoading(true);
      const result = await previewAgentAction({
        workspaceId,
        body: buildBody(),
      });
      if (seq !== previewSeq.current) return;
      setPreviewLoading(false);
      setPreviewOpener(result.error ? null : (result.opener ?? null));
    }, 650);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isComplete,
    type,
    personaMode,
    persona,
    goal,
    notes,
    name,
    standupStyle,
    standupChannelId,
    selectedMemberIds,
    contextIntegrations,
    triggerMode,
  ]);

  function validate(): string | null {
    if (!name.trim()) return "Enter a name for this agent.";
    if (isStandup && !standupChannelId) {
      return "Select a channel for the standup.";
    }
    if (selectedMemberIds.length === 0) {
      return isStandup
        ? "Select at least one participant."
        : "Select at least one recipient.";
    }
    if (!isManual && frequency === "specific_days" && daysOfWeek.length === 0) {
      return "Select at least one day.";
    }
    return null;
  }

  function handleDeploy() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deployAgentAction({
        workspaceId,
        body: buildBody(),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (isReachout) {
        router.push("/agents?deployed=reachout");
        return;
      }
      setDeployed({
        name: name.trim(),
        detail: triggerSummary(),
      });
    });
  }

  function handleSave() {
    if (!editTarget) return;
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateAgentAction({
        workspaceId,
        agentId: editTarget.id,
        kind: editTarget.kind,
        body: buildBody(),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onCloseEdit?.();
    });
  }

  function handleTest() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    startTestTransition(async () => {
      const result = await testAgentAction({
        workspaceId,
        body: buildBody(),
      });
      if (result.error) {
        setToast({ title: "Test failed", sub: result.error });
      } else if ((result.sessionsStarted ?? 0) === 0) {
        setToast({
          title: "Test failed",
          sub: "The standup did not start. Check your channel and participants.",
        });
      } else {
        setToast({
          title: "Test started",
          sub: isStandup
            ? "Watch the standup kick off in your channel."
            : "Check Slack — the agent just sent its first message.",
        });
      }
    });
  }

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(handle);
  }, [toast]);

  const headerTime = formatScheduleTimePreview(timeLocal, timezone);

  function triggerSummary(): string {
    if (isReachout) return "Sends once when deployed";
    if (triggerMode === "manual") return "Manual · runs on demand";
    if (triggerMode === "event") return "On an event";
    return `${formatScheduleDaysPreview(frequency, daysOfWeek)} · ${headerTime}`;
  }

  const audienceSummary = isStandup
    ? rollupChannels.find((c) => c.id === standupChannelId)?.name
      ? `#${rollupChannels.find((c) => c.id === standupChannelId)!.name.replace(/^#/, "")}`
      : "channel"
    : `${selectedMemberIds.length} ${selectedMemberIds.length === 1 ? "person" : "people"}`;

  const channelSummary =
    selectedChannelIds.length > 0
      ? selectedChannelIds
          .map((id) => rollupChannels.find((c) => c.id === id)?.name)
          .filter(Boolean)
          .map((n) => `#${String(n).replace(/^#/, "")}`)
          .join(", ")
      : selectedRosterDmIds.length > 0
        ? `${selectedRosterDmIds.length} DM rollup${selectedRosterDmIds.length === 1 ? "" : "s"}`
        : "Not set";

  if (!isStandup && !dailyStandup) {
    return (
      <p className="text-sm text-muted-foreground">
        No templates available. Contact support if this persists.
      </p>
    );
  }

  return (
    <div className="ag-split">
      {/* ---------------- config form ---------------- */}
      <div className="ag-form">
        <AgentSection title="Agent type">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {DEPLOY_AGENT_TYPES.map((t) => {
              const Icon = TYPE_ICONS[t.id];
              const active = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={isPending || isEdit}
                  className={cn(agentTypeCardVariants({ active }))}
                  onClick={() => setType(t.id)}
                >
                  <span className={cn(agentTypeIconVariants({ active }))}>
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold">
                      {t.name}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                      {t.desc}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "absolute top-2.5 right-2.5 text-[color:var(--brand-green-soft)] transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <Check className="size-[15px]" />
                  </span>
                </button>
              );
            })}
          </div>
        </AgentSection>

        <AgentDivider />

        <AgentSection title="Persona">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              className={cn(agentPillVariants({ selected: isPretrained }))}
              onClick={() => selectPersonaMode("pretrained")}
            >
              Scrum Master (pretrained)
            </button>
            <button
              type="button"
              disabled={isPending}
              className={cn(
                agentPillVariants({ selected: personaMode === "custom" }),
              )}
              onClick={() => selectPersonaMode("custom")}
            >
              Custom persona
            </button>
          </div>
          {!isPretrained ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="agent-persona">Role / persona</Label>
                <Textarea
                  id="agent-persona"
                  rows={4}
                  value={persona}
                  onChange={(event) => setPersona(event.target.value)}
                  disabled={isPending}
                />
                <p className={agentFieldHintClass}>
                  The system prompt that shapes how the agent speaks and
                  behaves.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-goal">Goal / intent</Label>
                <Input
                  id="agent-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  disabled={isPending}
                  placeholder="Capture daily progress and surface blockers…"
                />
              </div>
            </>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="agent-notes">Note</Label>
            <Textarea
              id="agent-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={isPending}
              placeholder="Optional context, commands, or constraints for this agent…"
            />
            <p className={agentFieldHintClass}>
              Standing instructions the agent should keep in mind (not shown to
              teammates verbatim).
            </p>
          </div>
        </AgentSection>

        {isStandup ? (
          <>
            <AgentDivider />
            <AgentSection title="Standup style">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  className={cn(
                    agentPillVariants({
                      selected: standupStyle === "broadcast",
                    }),
                  )}
                  onClick={() => setStandupStyle("broadcast")}
                >
                  Broadcast
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  className={cn(
                    agentPillVariants({
                      selected: standupStyle === "sequential",
                    }),
                  )}
                  onClick={() => setStandupStyle("sequential")}
                >
                  Sequential
                </button>
              </div>
              <p className={agentFieldHintClass}>
                {standupStyle === "broadcast"
                  ? "Posts one thread in the channel; teammates reply in the thread."
                  : "Asks each participant one at a time in the channel."}
              </p>
            </AgentSection>
          </>
        ) : null}

        <AgentDivider />

        <AgentSection title="Audience">
          {isStandup ? (
            <ChannelChipsPicker
              channels={chatChannels}
              selectedIds={standupChannelId ? [standupChannelId] : []}
              onChange={(ids) => setStandupChannelId(ids[0] ?? "")}
              disabled={isPending}
              error={chatChannelsError}
              label={STANDUP_CHANNEL_LABEL[communicationPlatform]}
              selectionMode="single"
            />
          ) : null}
          <RecipientChipsPicker
            members={rosterMembers}
            selectedIds={selectedMemberIds}
            onChange={setSelectedMemberIds}
            disabled={isPending}
            label={isStandup ? "Participants" : "Recipients"}
          />
          <ChannelChipsPicker
            channels={rollupChannels}
            selectedIds={selectedChannelIds}
            onChange={setSelectedChannelIds}
            disabled={isPending}
            error={rollupChannelsError}
          />
          <RecipientChipsPicker
            members={rosterMembers}
            selectedIds={selectedRosterDmIds}
            onChange={setSelectedRosterDmIds}
            disabled={isPending}
            label="Direct messages (rollups)"
          />
        </AgentSection>

        <AgentDivider />

        <AgentSection title="Trigger">
          {isReachout ? (
            <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Clock className="size-[14px]" /> Sends once when you deploy it.
              No recurring schedule.
            </p>
          ) : (
            <TriggerScheduleSection
              triggerMode={triggerMode}
              onTriggerModeChange={setTriggerMode}
              timezone={timezone}
              frequency={frequency}
              daysOfWeek={daysOfWeek}
              timeLocal={timeLocal}
              onTimezoneChange={setTimezone}
              onFrequencyChange={setFrequency}
              onDaysOfWeekChange={setDaysOfWeek}
              onTimeLocalChange={setTimeLocal}
              disabled={isPending}
            />
          )}
        </AgentSection>

        <AgentDivider />

        <AgentSection title="Details">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Name</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isPending}
              maxLength={100}
              placeholder={
                isStandup
                  ? "Engineering standup"
                  : isReachout
                    ? "Quick check on the release"
                    : "Friday eng standup"
              }
            />
          </div>
          <AppContextPicker
            options={appContextOptions}
            selectedIds={contextIntegrations}
            onChange={setContextIntegrations}
            disabled={isPending}
            connectedOnly
          />
        </AgentSection>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      {/* ---------------- live-preview rail ---------------- */}
      <div className="ag-rail">
        <SlackPreview
          opener={isComplete ? previewOpener : null}
          loading={isComplete && (previewLoading || previewOpener === null)}
          time={headerTime}
        />
        <ConfigSummary
          kind={type}
          typeName={typeName}
          goal={isPretrained ? "Capture progress & blockers" : goal}
          audience={audienceSummary}
          channel={channelSummary}
          trigger={triggerSummary()}
          isEvent={!isReachout && triggerMode === "event"}
        />
        {isEdit ? (
          <div className="ag-deploy-bar">
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={isPending || !isComplete}
              title={
                isComplete ? undefined : "Complete the required fields to save"
              }
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-[15px]" />
              )}
              Save changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCloseEdit?.()}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="ag-deploy-bar">
            <Button
              type="button"
              className="flex-1"
              onClick={handleDeploy}
              disabled={isPending || isTesting || !isComplete}
              title={
                isComplete
                  ? undefined
                  : "Complete the required fields to deploy"
              }
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-[15px]" />
              )}
              {isReachout ? "Send reach-out" : "Deploy agent"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isPending || isTesting || !isComplete}
              title={
                isComplete
                  ? "Run this agent once, right now"
                  : "Complete the form to test"
              }
            >
              {isTesting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FlaskConical className="size-[15px]" />
              )}
              Test
            </Button>
          </div>
        )}
      </div>

      {toast ? (
        <div className="ag-toast" role="status" aria-live="polite">
          <span className="ag-toast-ico">
            <FlaskConical className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="ag-toast-title">{toast.title}</div>
            <div className="ag-toast-sub">{toast.sub}</div>
          </div>
        </div>
      ) : null}

      {deployed ? (
        <AgentDeployedDialog
          name={deployed.name}
          detail={deployed.detail}
          onClose={() => router.push(`/agents?deployed=${type}`)}
        />
      ) : null}
    </div>
  );
}
