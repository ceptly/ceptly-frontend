"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Loader2, Rocket, Save } from "lucide-react";

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
  SCHEDULE_PRESETS,
  type AgentDeployInitialValues,
  type AgentEditTarget,
  type AgentTriggerMode,
  type PersonaMode,
} from "@/lib/agents";
import {
  agentFieldHintClass,
  agentPillVariants,
} from "@/lib/agents-ui";
import type { AgentDeployBody } from "@/lib/api/agents";
import type {
  ChatChannel,
  CommunicationPlatform,
} from "@/lib/api/communication";
import {
  FALLBACK_PERSONAS,
  personaSurfaces,
  type PersonaOption,
} from "@/lib/api/personas";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type {
  AppContextOption,
  ScheduleFrequency,
  ChannelStyle,
} from "@/lib/api/types";
import {
  agentDeployValuesComplete,
  buildAgentDeployBody,
  buildAgentDeployDebugSnapshot,
} from "@/lib/agent-deploy-body";
import {
  formatScheduleDaysPreview,
  formatScheduleTimePreview,
} from "@/lib/schedule/preview";
import { cn } from "@/lib/utils";

function defaultContextIntegrations(options: AppContextOption[]): string[] {
  const linear = options.find((item) => item.id === "linear");
  return linear?.selectable ? ["linear"] : [];
}

interface AgentDeployFieldsProps {
  workspaceId: string;
  workspaceTimezone: string;
  /** Persona presets from GET /api/personas. */
  personas?: PersonaOption[];
  rosterMembers: RosterMember[];
  appContextOptions: AppContextOption[];
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
  chatChannels: ChatChannel[];
  communicationPlatform: CommunicationPlatform;
  chatChannelsError?: string | null;
  /** When set, the form edits an existing agent instead of deploying a new one. */
  editTarget?: AgentEditTarget;
  /** Prefill values for edit mode. */
  initialValues?: AgentDeployInitialValues;
  /** Where to go after a successful save / cancel in edit mode. */
  onCloseEdit?: () => void;
  /**
   * Reports the full form state on every change. Lets the chat keep the
   * inline form in sync with the agent without making the form controlled.
   */
  onValuesChange?: (values: AgentDeployInitialValues) => void;
}

export function AgentDeployFields({
  workspaceId,
  workspaceTimezone,
  personas = FALLBACK_PERSONAS,
  rosterMembers,
  appContextOptions,
  slackChannels,
  slackChannelsError,
  chatChannels,
  communicationPlatform,
  chatChannelsError,
  editTarget,
  initialValues,
  onCloseEdit,
  onValuesChange,
}: AgentDeployFieldsProps) {
  const isEdit = Boolean(editTarget);
  const router = useRouter();

  const [destinationType, setDestinationType] = useState<"channel" | "dm">(
    initialValues?.destinationType ?? "dm",
  );
  const [channelStyle, setChannelStyle] = useState<ChannelStyle>(
    initialValues?.channelStyle ?? "broadcast",
  );
  const [channelId, setChannelId] = useState(
    initialValues?.channelId ?? "",
  );
  const [personaMode, setPersonaMode] = useState<PersonaMode>(
    initialValues?.personaMode ?? "pretrained",
  );
  const [presetId, setPresetId] = useState(
    initialValues?.presetId ?? personas[0]?.id ?? "scrum_master",
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
  const [configCopied, setConfigCopied] = useState(false);

  const [previewOpener, setPreviewOpener] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const isChannelDest = destinationType === "channel";
  const isPretrained = personaMode === "pretrained";
  const isManual = triggerMode === "manual";

  const rollupChannels = useMemo<SlackChannel[]>(
    () => (isChannelDest ? chatChannels : slackChannels),
    [isChannelDest, slackChannels, chatChannels],
  );
  const rollupChannelsError = isChannelDest ? chatChannelsError : slackChannelsError;

  function selectPreset(id: string) {
    setPersonaMode("pretrained");
    setPresetId(id);
    setPersona("");
    setGoal("");
  }

  const personaSurface = isChannelDest ? "channel" : "dm";
  const availablePersonas = useMemo(
    () => personas.filter((p) => personaSurfaces(p).includes(personaSurface)),
    [personas, personaSurface],
  );

  const selectedPersona = personas.find((p) => p.id === presetId);

  // The form's full state as the shared AgentDeployInitialValues shape; both the
  // deploy-body builder and the chat-side card consume this exact structure.
  const currentValues = useMemo<AgentDeployInitialValues>(
    () => ({
      destinationType,
      personaMode,
      presetId,
      persona,
      goal,
      notes,
      name,
      channelStyle,
      channelId,
      timezone,
      frequency,
      daysOfWeek,
      timeLocal,
      triggerMode,
      selectedMemberIds,
      selectedChannelIds,
      selectedRosterDmIds,
      contextIntegrations,
    }),
    [
      destinationType,
      personaMode,
      presetId,
      persona,
      goal,
      notes,
      name,
      channelStyle,
      channelId,
      timezone,
      frequency,
      daysOfWeek,
      timeLocal,
      triggerMode,
      selectedMemberIds,
      selectedChannelIds,
      selectedRosterDmIds,
      contextIntegrations,
    ],
  );

  const isComplete = useMemo(
    () => agentDeployValuesComplete(currentValues),
    [currentValues],
  );

  function buildBody(): AgentDeployBody {
    return buildAgentDeployBody(currentValues, { chatChannels, slackChannels });
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
    destinationType,
    personaMode,
    presetId,
    persona,
    goal,
    notes,
    name,
    channelStyle,
    channelId,
    selectedMemberIds,
    contextIntegrations,
    triggerMode,
  ]);

  const onValuesChangeRef = useRef(onValuesChange);
  useEffect(() => {
    onValuesChangeRef.current = onValuesChange;
  }, [onValuesChange]);
  useEffect(() => {
    onValuesChangeRef.current?.(currentValues);
  }, [currentValues]);

  function validate(): string | null {
    if (!name.trim()) return "Enter a name for this agent.";
    if (isChannelDest && !channelId) {
      return "Select a channel for the meeting.";
    }
    if (selectedMemberIds.length === 0) {
      return "Select at least one participant.";
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
        body: buildBody(),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onCloseEdit?.();
    });
  }

  async function handleCopyConfig() {
    const payload = {
      ...buildAgentDeployDebugSnapshot(currentValues, {
        chatChannels,
        slackChannels,
      }),
      resolved: {
        personaPreset:
          isPretrained && selectedPersona
            ? { id: presetId, name: selectedPersona.name }
            : undefined,
        participants: selectedMemberIds.map((id) => ({
          id,
          displayName:
            rosterMembers.find((member) => member.id === id)?.display_name ??
            id,
        })),
        meetingChannel: isChannelDest ? destinationSummary : undefined,
        rollupTo: channelSummary,
        trigger: triggerSummary(),
      },
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setConfigCopied(true);
      setTimeout(() => setConfigCopied(false), 2000);
    } catch {
      setToast({
        title: "Copy failed",
        sub: "Could not access the clipboard.",
      });
    }
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
          sub: "The agent did not start. Check your channel and participants.",
        });
      } else {
        setToast({
          title: "Test started",
          sub: isChannelDest
            ? "Watch the meeting kick off in your channel."
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
    if (triggerMode === "manual") return "Runs once when deployed";
    if (triggerMode === "event") return "On an event";
    return `${formatScheduleDaysPreview(frequency, daysOfWeek)} · ${headerTime}`;
  }

  const audienceSummary = `${selectedMemberIds.length} ${selectedMemberIds.length === 1 ? "person" : "people"}`;

  const meetingChannelName = chatChannels.find((c) => c.id === channelId)?.name;
  const destinationSummary = isChannelDest
    ? meetingChannelName
      ? `#${meetingChannelName.replace(/^#/, "")}`
      : "Channel not set"
    : "Direct messages";

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

  return (
    <div className="ag-split-outer">
      <div className="ag-split">
        {/* ---------------- config form ---------------- */}
        <div className="ag-form">
          <AgentSection title="Persona">
            <div className="flex flex-wrap gap-2">
              {availablePersonas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={isPending}
                  className={cn(
                    agentPillVariants({
                      selected: isPretrained && presetId === p.id,
                    }),
                  )}
                  onClick={() => selectPreset(p.id)}
                  title={p.tagline}
                >
                  {p.name}
                </button>
              ))}
              <button
                type="button"
                disabled={isPending}
                className={cn(
                  agentPillVariants({ selected: personaMode === "custom" }),
                )}
                onClick={() => setPersonaMode("custom")}
              >
                Custom persona
              </button>
            </div>
            {isPretrained && selectedPersona?.tagline ? (
              <p className={agentFieldHintClass}>{selectedPersona.tagline}</p>
            ) : null}
            {isPretrained && selectedPersona?.interaction_mode === "report" ? (
              <p className={agentFieldHintClass}>
                This persona posts a compiled report on schedule — it doesn&apos;t
                run a conversation, so questions and meeting style don&apos;t
                apply.
              </p>
            ) : null}
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

          <AgentDivider />

          <AgentSection title="Audience">
            <RecipientChipsPicker
              members={rosterMembers}
              selectedIds={selectedMemberIds}
              onChange={setSelectedMemberIds}
              disabled={isPending}
              label="Participants"
            />

            <div className="space-y-2">
              <Label>Meeting destination</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending || isEdit}
                  className={cn(agentPillVariants({ selected: destinationType === "dm" }))}
                  onClick={() => setDestinationType("dm")}
                >
                  Direct messages
                </button>
                <button
                  type="button"
                  disabled={isPending || isEdit}
                  className={cn(agentPillVariants({ selected: isChannelDest }))}
                  onClick={() => setDestinationType("channel")}
                >
                  Channel
                </button>
              </div>
              <p className={agentFieldHintClass}>
                {isChannelDest
                  ? "The agent will run the meeting in the selected channel."
                  : "The agent will message each participant directly."}
              </p>
            </div>

            {isChannelDest ? (
              <ChannelChipsPicker
                channels={chatChannels}
                selectedIds={channelId ? [channelId] : []}
                onChange={(ids) => setChannelId(ids[0] ?? "")}
                disabled={isPending}
                error={chatChannelsError}
                label={
                  communicationPlatform === "teams"
                    ? "Teams channel"
                    : "Slack channel"
                }
                selectionMode="single"
              />
            ) : null}

            {isChannelDest ? (
              <div className="space-y-2">
                <Label>Conversation style</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    className={cn(
                      agentPillVariants({ selected: channelStyle === "broadcast" }),
                    )}
                    onClick={() => setChannelStyle("broadcast")}
                  >
                    Broadcast
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    className={cn(
                      agentPillVariants({ selected: channelStyle === "sequential" }),
                    )}
                    onClick={() => setChannelStyle("sequential")}
                  >
                    Sequential
                  </button>
                </div>
                <p className={agentFieldHintClass}>
                  {channelStyle === "broadcast"
                    ? "Posts one thread; teammates all respond in the thread."
                    : "Asks each participant one at a time."}
                </p>
              </div>
            ) : null}

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
          </AgentSection>

          <AgentDivider />

          <AgentSection title="Details">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent name</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isPending}
                maxLength={100}
                placeholder="Engineering meeting"
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
            destinationType={destinationType}
            destination={destinationSummary}
            goal={
              isPretrained
                ? selectedPersona?.goal || "Capture progress & blockers"
                : goal
            }
            audience={audienceSummary}
            channel={channelSummary}
            trigger={triggerSummary()}
            isEvent={triggerMode === "event"}
            onCopyConfig={() => void handleCopyConfig()}
            configCopied={configCopied}
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
                Deploy agent
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
            onClose={() =>
              router.push(
                `/agents?deployed=${isChannelDest ? "meeting" : "conversation"}`,
              )
            }
          />
        ) : null}
      </div>
    </div>
  );
}
