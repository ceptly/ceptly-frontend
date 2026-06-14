"use client";

import {
  ArrowUp,
  FileText,
  Loader2,
  Mic,
  PanelRight,
  Paperclip,
  RefreshCw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useStatsigClient } from "@statsig/react-bindings";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useSpeechDictation } from "@/hooks/use-speech-dictation";
import { cn } from "@/lib/utils";

import { deployAgentAction, testAgentAction } from "@/actions/agents";
import { markChatFormDeployedAction } from "@/actions/workspace-chat";
import { AgentDeployProposalCard } from "@/components/chat/agent-deploy-proposal";
import { AgentDeployFields } from "@/components/agents/agent-deploy-fields";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatMentionTextarea } from "@/components/chat/chat-mention-textarea";
import { formatMessageWithMentionContext } from "@/lib/chat-mentions";
import {
  agentDeployValuesComplete,
  buildAgentDeployBody,
} from "@/lib/agent-deploy-body";
import type { AgentDeployInitialValues } from "@/lib/agents";
import {
  agentFormValuesToInitialValues,
  initialValuesToAgentFormValues,
} from "@/lib/chat-agent-form";
import type {
  ChatChannel,
  CommunicationPlatform,
} from "@/lib/api/communication";
import { FALLBACK_PERSONAS, type PersonaOption } from "@/lib/api/personas";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type {
  AgentFormValues,
  AppContextOption,
  ChatAgentId,
  ChatAttachment,
  SetupChatMessage,
} from "@/lib/api/types";
import {
  createInitialActivity,
  streamChatWorkspace,
  uploadChatAttachment,
  type AgentActivityState,
} from "@/lib/api/workspace-chat-stream";

const ATTACHMENT_ACCEPT = ".pdf,.txt,.md,.markdown";
const MAX_ATTACHMENTS = 5;

const AGENT_LABELS: Record<ChatAgentId, string> = {
  team_qa: "Team insights",
  meeting_creator: "Meeting setup",
};

interface EmployeeChatPromptProps {
  workspaceId: string;
  canEdit?: boolean;
  appContextOptions?: AppContextOption[];
  slackChannels?: SlackChannel[];
  slackChannelsError?: string | null;
  rosterMembers?: RosterMember[];
  initialMessages?: SetupChatMessage[];
  initialSessionId?: string | null;
  workspaceTimezone?: string;
  chatChannels?: ChatChannel[];
  communicationPlatform?: CommunicationPlatform;
  chatChannelsError?: string | null;
  personas?: PersonaOption[];
}

function findInitialAgentFormValues(
  messages: SetupChatMessage[],
): AgentFormValues | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") {
      continue;
    }
    if (message.ui_component?.type === "agent_deployed") {
      return null;
    }
    if (message.ui_component?.type === "agent_form") {
      return message.ui_component.values;
    }
  }
  return null;
}

function findInitialDeploySuccess(messages: SetupChatMessage[]): boolean {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") {
      continue;
    }
    if (message.ui_component?.type === "agent_deployed") {
      return true;
    }
    if (message.ui_component?.type === "agent_form") {
      return false;
    }
  }
  return false;
}

export function EmployeeChatPrompt({
  workspaceId,
  canEdit = true,
  appContextOptions = [],
  slackChannels = [],
  slackChannelsError = null,
  rosterMembers = [],
  initialMessages = [],
  initialSessionId = null,
  workspaceTimezone = "America/Chicago",
  chatChannels = [],
  communicationPlatform = "slack",
  chatChannelsError = null,
  personas = FALLBACK_PERSONAS,
}: EmployeeChatPromptProps) {
  const { client } = useStatsigClient();

  const [messages, setMessages] = useState<SetupChatMessage[]>(initialMessages);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [agentFormValues, setAgentFormValues] =
    useState<AgentFormValues | null>(() =>
      findInitialAgentFormValues(initialMessages),
    );
  const [agentFormVersion, setAgentFormVersion] = useState(0);
  // Latest user-edited form state; echoed back to the agent on each message.
  const agentFormDraftRef = useRef<AgentDeployInitialValues | null>(null);
  const [input, setInput] = useState("");
  const [chatPending, setChatPending] = useState(false);
  const [pendingActivity, setPendingActivity] =
    useState<AgentActivityState | null>(null);
  const [deployPending, setDeployPending] = useState(false);
  const [testPending, setTestPending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deploySuccess, setDeploySuccess] = useState(() =>
    findInitialDeploySuccess(initialMessages),
  );
  const [activeAgent, setActiveAgent] = useState<ChatAgentId | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<
    ChatAttachment[]
  >([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // On narrow viewports the conversation and the inline form can't sit
  // side-by-side, so a bottom selector toggles between them (Replit-style).
  const [mobileView, setMobileView] = useState<"chat" | "form">("chat");
  const [desktopFormOpen, setDesktopFormOpen] = useState(false);
  const hadFormRef = useRef(false);

  const hasMessages = messages.length > 0 || chatPending;
  const isEmptyState = !hasMessages && !chatError;
  const chatDisabled = chatPending || !canEdit;
  const hasAgentForm = agentFormValues !== null;

  // The latest agent-filled form state, in the deploy form's shape. Drives the
  // inline deploy card so the user can deploy straight from the conversation.
  const deployCardValues = useMemo(
    () =>
      agentFormValues
        ? agentFormValuesToInitialValues(
            agentFormValues,
            workspaceTimezone,
            appContextOptions,
          )
        : null,
    [agentFormValues, workspaceTimezone, appContextOptions],
  );

  // When the form first appears, surface it on narrow viewports so the user
  // notices it; once they've seen it, leave their tab choice alone.
  useEffect(() => {
    if (hasAgentForm && !hadFormRef.current) {
      setMobileView("form");
    }
    hadFormRef.current = hasAgentForm;
  }, [hasAgentForm]);

  const {
    supported: dictationSupported,
    listening: dictationListening,
    error: dictationError,
    toggle: toggleDictation,
    stop: stopDictation,
    clearError: clearDictationError,
  } = useSpeechDictation({
    value: input,
    onChange: setInput,
    disabled: chatDisabled,
  });

  async function handleFilesPicked(files: FileList | null) {
    if (!files?.length) {
      return;
    }
    const room = MAX_ATTACHMENTS - pendingAttachments.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
      return;
    }

    setAttachmentUploading(true);
    for (const file of Array.from(files).slice(0, room)) {
      const { attachment, error } = await uploadChatAttachment(
        workspaceId,
        file,
      );
      if (error || !attachment) {
        toast.error(error ?? `Could not upload ${file.name}.`);
        continue;
      }
      setPendingAttachments((current) => [...current, attachment]);
    }
    setAttachmentUploading(false);
  }

  function removePendingAttachment(id: string) {
    setPendingAttachments((current) =>
      current.filter((attachment) => attachment.id !== id),
    );
  }

  async function handleSend(content: string, agentOverride?: ChatAgentId) {
    const trimmed = content.trim();
    if (!trimmed || chatPending || !canEdit) {
      return;
    }

    client.logEvent("employee_chat_submit");
    stopDictation();

    const attachmentsToSend = pendingAttachments;
    const nextMessages: SetupChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: trimmed,
        ...(attachmentsToSend.length ? { attachments: attachmentsToSend } : {}),
      },
    ];
    setMessages(nextMessages);
    setInput("");
    setPendingAttachments([]);
    setChatPending(true);
    const initialActivity = createInitialActivity();
    setPendingActivity(initialActivity);
    setChatError(null);
    setDeploySuccess(false);
    setDeployError(null);

    const agentToSend = agentOverride;

    // Echo the inline form (including the user's direct edits) so the agent
    // updates it instead of starting over.
    const formStateToSend = agentFormDraftRef.current
      ? initialValuesToAgentFormValues(agentFormDraftRef.current)
      : agentFormValues;

    let completedActivity: AgentActivityState = initialActivity;

    const streamResult = await streamChatWorkspace(
      workspaceId,
      [
        ...messages,
        {
          role: "user",
          content: formatMessageWithMentionContext(
            trimmed,
            rosterMembers,
            slackChannels,
          ),
          ...(attachmentsToSend.length
            ? { attachments: attachmentsToSend }
            : {}),
        },
      ],
      agentToSend,
      {
        onActivity: (activity) => {
          completedActivity = activity;
          setPendingActivity(activity);
        },
      },
      sessionId,
      formStateToSend,
    );

    setChatPending(false);
    setPendingActivity(null);

    if (streamResult.error) {
      if (streamResult.retryAfterSeconds !== undefined) {
        toast.error("You're sending messages too quickly", {
          description: streamResult.error,
          duration: Math.min(streamResult.retryAfterSeconds, 15) * 1000,
        });
      }
      setChatError(streamResult.error);
      return;
    }

    const result = streamResult.result;
    if (!result) {
      setChatError("Failed to send message.");
      return;
    }

    if (result.session_id) {
      setSessionId(result.session_id);
    }

    if (result.agent) {
      setActiveAgent(result.agent);
    }

    if (result.assistant_message) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: result.assistant_message,
          ui_component: result.ui_component ?? undefined,
          activity: completedActivity,
        },
      ]);
    }

    if (result.ui_component?.type === "agent_form") {
      // Remount the deploy form with the agent's merged values; the draft ref
      // is repopulated immediately by the form's onValuesChange.
      setAgentFormValues(result.ui_component.values);
      setAgentFormVersion((version) => version + 1);
    }
  }

  function interactiveDisabled() {
    return chatDisabled;
  }

  /** Resolve the freshest form state: the user's live form edits, else the
   * agent's latest fill. The form panel stays mounted whenever a form exists,
   * so the draft ref reflects any direct edits. */
  function resolveDeployValues(): AgentDeployInitialValues | null {
    return agentFormDraftRef.current ?? deployCardValues;
  }

  async function handleDeployAgent() {
    const values = resolveDeployValues();
    if (
      !values ||
      !agentDeployValuesComplete(values) ||
      deployPending ||
      !canEdit
    ) {
      return;
    }

    setDeployPending(true);
    setDeployError(null);

    const result = await deployAgentAction({
      workspaceId,
      body: buildAgentDeployBody(values, { chatChannels, slackChannels }),
    });

    setDeployPending(false);

    if (result.error) {
      setDeployError(result.error);
      return;
    }

    client.logEvent("employee_chat_agent_deployed");
    // Collapse the inline form and surface a success note in its place.
    setAgentFormValues(null);
    agentFormDraftRef.current = null;
    setAgentFormVersion(0);
    setDeploySuccess(true);
    setMessages((current) => {
      for (let index = current.length - 1; index >= 0; index -= 1) {
        const message = current[index];
        if (
          message?.role === "assistant" &&
          message.ui_component?.type === "agent_form"
        ) {
          const next = [...current];
          next[index] = {
            ...message,
            ui_component: {
              type: "agent_deployed",
              ...(values.name ? { name: values.name } : {}),
            },
          };
          return next;
        }
      }
      return current;
    });
    if (sessionId) {
      void markChatFormDeployedAction({
        workspaceId,
        sessionId,
        name: values.name,
      });
    }
  }

  async function handleTestAgent() {
    const values = resolveDeployValues();
    if (
      !values ||
      !agentDeployValuesComplete(values) ||
      testPending ||
      !canEdit
    ) {
      return;
    }

    setTestPending(true);
    const result = await testAgentAction({
      workspaceId,
      body: buildAgentDeployBody(values, { chatChannels, slackChannels }),
    });
    setTestPending(false);

    if (result.error) {
      toast.error("Test failed", { description: result.error });
      return;
    }
    if ((result.sessionsStarted ?? 0) === 0) {
      toast.error("Test failed", {
        description:
          "The agent did not start. Check your channel and participants.",
      });
      return;
    }
    toast.success("Test started", {
      description:
        values.destinationType === "channel"
          ? "Watch the meeting kick off in your channel."
          : "Check Slack — the agent just sent its first message.",
    });
  }

  function handleNewChat() {
    setMessages([]);
    setSessionId(null);
    setAgentFormValues(null);
    setAgentFormVersion(0);
    agentFormDraftRef.current = null;
    setInput("");
    setPendingAttachments([]);
    setChatPending(false);
    setPendingActivity(null);
    setChatError(null);
    setDeployError(null);
    setDeploySuccess(false);
    setDeployPending(false);
    setTestPending(false);
    setActiveAgent(null);
    client.logEvent("employee_chat_refresh_click");
  }

  const agentBadgeLabel = activeAgent ? AGENT_LABELS[activeAgent] : null;

  const promptForm = (
    <form
      className="ceptly-composer"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSend(input);
      }}
    >
      {agentBadgeLabel ? (
        <div className="border-b border-border px-3 py-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {agentBadgeLabel}
          </Badge>
        </div>
      ) : null}
      <ChatMentionTextarea
        variant="chat"
        placeholder="Ask about your team — @ for people, # for channels. Enter to send, Shift+Enter for new line."
        rows={3}
        value={input}
        rosterMembers={rosterMembers}
        slackChannels={slackChannels}
        disabled={chatDisabled}
        onChange={setInput}
        onEnter={(value) => {
          if (!value.trim() || chatDisabled) {
            return;
          }
          void handleSend(value);
        }}
      />
      {pendingAttachments.length > 0 || attachmentUploading ? (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
          {pendingAttachments.map((attachment) => (
            <span
              key={attachment.id}
              className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border bg-muted/40 py-1 pr-1 pl-2 text-xs text-foreground"
            >
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{attachment.filename}</span>
              <button
                type="button"
                className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${attachment.filename}`}
                onClick={() => removePendingAttachment(attachment.id)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {attachmentUploading ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Uploading…
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-center justify-between px-3 pb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            void handleFilesPicked(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-muted-foreground"
          disabled={
            chatDisabled ||
            attachmentUploading ||
            pendingAttachments.length >= MAX_ATTACHMENTS
          }
          aria-label="Add attachment"
          title="Attach PDF, text, or Markdown"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip />
        </Button>
        <div className="ceptly-composer-send-group flex items-center">
          {hasMessages ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-none"
              aria-label="Start new conversation"
              title="Start new conversation"
              onClick={handleNewChat}
            >
              <RefreshCw />
            </Button>
          ) : null}
          {dictationSupported ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className={cn(
                "rounded-none",
                dictationListening &&
                  "z-10 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive",
              )}
              disabled={chatDisabled}
              aria-label={
                dictationListening ? "Stop dictation" : "Start dictation"
              }
              aria-pressed={dictationListening}
              title={
                dictationError ??
                (dictationListening ? "Stop dictation" : "Dictate message")
              }
              onClick={() => {
                clearDictationError();
                toggleDictation();
              }}
            >
              <Mic className={cn(dictationListening && "animate-pulse")} />
            </Button>
          ) : null}
          <Button
            type="submit"
            variant="default"
            size="icon-sm"
            className="rounded-none"
            disabled={!input.trim() || chatDisabled}
            aria-label="Send message"
          >
            {chatPending ? <Loader2 className="animate-spin" /> : <ArrowUp />}
          </Button>
        </div>
      </div>
    </form>
  );

  if (!canEdit) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Conversation schedules are managed by your workspace admin. View the
          current schedule in{" "}
          <Link
            href="/activity"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Activity
          </Link>
          .
        </p>
      </div>
    );
  }

  if (isEmptyState) {
    return (
      <div className="mx-auto flex w-full max-w-[700px] flex-1 flex-col justify-center gap-4">
        <h1 className="font-[family-name:var(--font-heading)] text-center text-[34px] leading-tight font-normal tracking-tight text-foreground">
          What can I do for you?
        </h1>
        {promptForm}
      </div>
    );
  }

  const messagesScroll = hasMessages ? (
    <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
      <div className="mx-auto w-full max-w-[700px]">
        <ChatMessageList
          messages={messages}
          pending={chatPending}
          pendingActivity={pendingActivity}
          slackChannels={slackChannels}
          rosterMembers={rosterMembers}
          interactiveDisabled={interactiveDisabled()}
        />
      </div>
    </div>
  ) : null;

  const composerBlock = (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-4">
      {chatError ? (
        <Alert variant="destructive">
          <AlertDescription>{chatError}</AlertDescription>
        </Alert>
      ) : null}

      {deployError ? (
        <Alert variant="destructive">
          <AlertDescription>{deployError}</AlertDescription>
        </Alert>
      ) : null}

      {hasAgentForm && deployCardValues && !deploySuccess ? (
        <div className="px-1">
          <AgentDeployProposalCard
            values={deployCardValues}
            chatChannels={chatChannels}
            pending={deployPending}
            testing={testPending}
            disabled={chatPending}
            onDeploy={() => void handleDeployAgent()}
            onTest={() => void handleTestAgent()}
            onEdit={() => {
              setDesktopFormOpen(true);
              setMobileView("form");
            }}
          />
        </div>
      ) : null}

      {deploySuccess ? (
        <p className="text-center text-sm text-muted-foreground">
          Agent deployed.{" "}
          <Link
            href="/agents"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Manage your agents
          </Link>
          .
        </p>
      ) : null}

      {promptForm}
      {hasAgentForm ? (
        <div className="flex justify-end xl:justify-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden xl:inline-flex gap-1.5 text-muted-foreground"
            onClick={() => setDesktopFormOpen((v) => !v)}
          >
            <PanelRight className="size-4" />
            {desktopFormOpen ? "Hide config" : "Show config"}
          </Button>
        </div>
      ) : null}
    </div>
  );

  const formPanel = hasAgentForm ? (
    <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
      <AgentDeployFields
        key={agentFormVersion}
        workspaceId={workspaceId}
        workspaceTimezone={workspaceTimezone}
        personas={personas}
        rosterMembers={rosterMembers}
        appContextOptions={appContextOptions}
        slackChannels={slackChannels}
        slackChannelsError={slackChannelsError}
        chatChannels={chatChannels}
        communicationPlatform={communicationPlatform}
        chatChannelsError={chatChannelsError}
        initialValues={agentFormValuesToInitialValues(
          agentFormValues!,
          workspaceTimezone,
          appContextOptions,
        )}
        onValuesChange={(values) => {
          agentFormDraftRef.current = values;
        }}
      />
    </div>
  ) : null;

  // No inline form yet → single-column conversation, unchanged.
  if (!hasAgentForm) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
        {messagesScroll}
        {composerBlock}
      </div>
    );
  }

  // Form present → conversation (left) and form (right) sit side-by-side on
  // wide viewports; below xl the bottom selector swaps between the two panes.
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col gap-6 xl:flex-row">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-4",
            desktopFormOpen && "xl:max-w-[460px]",
            mobileView === "form" && "hidden xl:flex",
          )}
        >
          {messagesScroll}
          {composerBlock}
        </div>

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col xl:border-l xl:border-border xl:pl-6",
            mobileView === "chat" && "hidden",
            desktopFormOpen ? "xl:flex" : "xl:hidden",
          )}
        >
          {formPanel}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[460px] xl:hidden">
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setMobileView("chat")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm transition-colors",
              mobileView === "chat"
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setMobileView("form")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm transition-colors",
              mobileView === "form"
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Config
          </button>
        </div>
      </div>
    </div>
  );
}
