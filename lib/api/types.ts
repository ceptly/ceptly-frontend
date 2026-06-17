export type ScheduleFrequency = "daily" | "specific_days";

export interface WorkspaceSchedule {
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
}

export type ConversationResultDestination =
  | {
      type: "slack_channel";
      channel_id: string;
      name?: string;
    }
  | {
      type: "roster_dm";
      roster_member_id: string;
    }
  | {
      type: "workspace_digest";
    };

export interface AppContextOption {
  id: string;
  label: string;
  description: string;
  coming_soon?: boolean;
  connected: boolean;
  selectable: boolean;
}

export interface ConversationRunTranscriptMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ConversationRunLegacyResponse {
  question_prompt: string;
  answer_text: string;
  question_at: string;
  answered_at: string;
}

export type ActivityAttentionItem =
  | {
      type: "missing_responses";
      agent_id: string;
      agent_name: string;
      session_id: string;
      missing_count: number;
      missing_names: string[];
    }
  | {
      type: "blocker";
      agent_id: string;
      session_id: string;
      member_name: string;
      agent_name: string;
      excerpt: string;
      occurred_at: string;
    }
  | {
      type: "awaiting_reply";
      agent_id: string;
      session_id: string;
      member_name: string;
      topic: string;
      started_at: string;
    }
  | {
      type: "roster_tracker_mismatch";
      roster_member_id: string;
      member_name: string;
      member_email: string;
      missing_trackers: ("linear" | "jira" | "monday")[];
    };

export interface ActivitySessionSummary {
  session_id: string;
  status: "active" | "completed" | "cancelled";
  started_at: string;
  completed_at: string | null;
  expected_count: number;
  responded_count: number;
  not_responded_count: number;
  summary_text: string | null;
}

export interface ActivityAgent {
  id: string;
  name: string;
  destination: "dm" | "channel";
  trigger: "scheduled" | "one_off";
  enabled: boolean;
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  channel_id: string | null;
  style: "broadcast" | "sequential" | null;
  latest_session: ActivitySessionSummary | null;
  session_count: number;
  missing_members: { roster_member_id: string; display_name: string }[];
}

export interface ActivityAdhocSession {
  conversation_id: string;
  session_id: string;
  conversation_name: string;
  member_name: string;
  status: "completed" | "in_progress" | "abandoned";
  started_at: string;
  completed_at: string | null;
  intent: "gather" | "inform";
  intent_label: string;
  topic: string | null;
  delivery_facts: string | null;
  agent_prompt: string | null;
}

export type ChannelStyle = "broadcast" | "sequential";

export interface ScheduledFollowUp {
  id: string;
  member_name: string;
  agent_id: string | null;
  agent_name: string | null;
  item_text: string;
  scheduled_for: string;
  status: "pending" | "fired" | "cancelled" | "dismissed";
}

export interface WorkspaceActivity {
  attention_count: number;
  attention_items: ActivityAttentionItem[];
  agents: ActivityAgent[];
  adhoc_sessions: ActivityAdhocSession[];
  scheduled_follow_ups: ScheduledFollowUp[];
  follow_ups_enabled: boolean;
}

export interface ProposedSchedule {
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
}

export interface ProposedConversation {
  name: string;
  purpose: string;
  schedule: ProposedSchedule;
  questions: string[];
  template_id?: string | null;
  roster_member_ids?: string[];
  context_integrations?: string[];
  result_destinations?: ConversationResultDestination[];
  /** Present on chat proposals when this entry matches an existing saved conversation. */
  unchanged_from_existing?: boolean;
}

export interface ConversationSetupPlan {
  conversations: ProposedConversation[];
  summary: string;
}

export interface DayPickerUiComponent {
  type: "day_picker";
  days_of_week: number[];
  resolved?: boolean;
}

export interface MemberPickerUiComponent {
  type: "member_picker";
  members: {
    id: string;
    display_name: string;
    email: string;
  }[];
  selected_member_ids: string[];
}

export interface SetupRecapUiComponent {
  type: "setup_recap";
  days_of_week: number[];
  members: {
    id: string;
    display_name: string;
    email: string;
  }[];
  selected_member_ids: string[];
  selected_context_integrations: string[];
  selected_channel_ids: string[];
  selected_roster_dm_ids: string[];
}

/**
 * Snake-case mirror of the deploy form (AgentDeployFields) state. The chat
 * agent prefills these from the conversation; the client echoes the user's
 * edits back as `form_state` on every turn so both stay in sync.
 */
export interface AgentFormValues {
  destination?: "dm" | "channel";
  trigger?: "scheduled" | "one_off";
  name?: string;
  notes?: string;
  persona_preset?: string;
  persona?: string;
  goal?: string;
  channel_style?: ChannelStyle;
  channel_id?: string;
  timezone?: string;
  frequency?: ScheduleFrequency;
  days_of_week?: number[];
  time_local?: string;
  roster_member_ids?: string[];
  result_channel_ids?: string[];
  result_roster_dm_ids?: string[];
  context_integrations?: string[];
}

export interface AgentFormUiComponent {
  type: "agent_form";
  values: AgentFormValues;
}

/** Persisted marker after the user deploys from chat; replaces agent_form in history. */
export interface AgentDeployedUiComponent {
  type: "agent_deployed";
  name?: string;
}

export type SetupChatUiComponent =
  | DayPickerUiComponent
  | MemberPickerUiComponent
  | SetupRecapUiComponent
  | AgentFormUiComponent
  | AgentDeployedUiComponent;

export interface ChatAttachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export interface SetupChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Files attached to a user message, sent to the model as document context. */
  attachments?: ChatAttachment[];
  ui_component?: SetupChatUiComponent;
  activity?: import("./workspace-chat-stream").AgentActivityState;
}

export type ChatAgentId = "team_qa" | "meeting_creator";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt?: string;
  onboardingCompleted?: boolean;
  workspaces?: WorkspaceMembership[];
}

export interface WorkspaceMembership {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
  subscriptionStatus?:
    | "none"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "incomplete";
  hasActiveSubscription?: boolean;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  token: string;
  role: WorkspaceMembership["role"];
  inviteUrl: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitePreview {
  workspaceName: string;
  invitedEmail: string;
  inviterName: string;
  expiresAt: string;
  status: "pending" | "expired" | "accepted";
}

export interface WorkspaceMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: WorkspaceMembership["role"];
  joined_at: string;
}

export interface AuthMeResponse {
  success: boolean;
  data?: {
    user: AuthUser;
  };
  error?: string;
}

export interface AuthSessionResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
  error?: string;
}

export type DashboardRangeDays = 7 | 30 | 90;

export interface DashboardKpis {
  sessions_completed: number;
  response_rate_pct: number | null;
  response_rate_delta_pct: number | null;
  open_blockers: number;
  oldest_open_blocker_days: number | null;
  avg_resolution_hours: number | null;
  tasks_done: number;
  carry_over_count: number;
  pending_follow_ups: number;
}

export interface DashboardParticipationPoint {
  date: string;
  sessions: number;
  expected: number;
  responded: number;
  response_rate_pct: number | null;
}

export interface DashboardAgentParticipation {
  agent_id: string;
  agent_name: string;
  sessions: number;
  expected: number;
  responded: number;
  response_rate_pct: number | null;
}

export interface DashboardBlockerTrendPoint {
  date: string;
  reported: number;
  resolved: number;
  open_at_end: number;
}

export interface DashboardBlockerStats {
  trend: DashboardBlockerTrendPoint[];
  open_count: number;
  reported_in_window: number;
  resolved_in_window: number;
  avg_resolution_hours: number | null;
  median_resolution_hours: number | null;
  oldest_open: {
    id: string;
    description: string;
    member_name: string;
    age_days: number;
  } | null;
  age_buckets: { bucket: "0-2d" | "3-6d" | "7-13d" | "14d+"; count: number }[];
}

export interface DashboardCarryOverCell {
  roster_member_id: string;
  date: string;
  carried_tasks: number;
  re_reported_blockers: number;
}

export interface DashboardCarryOverGrid {
  days: string[];
  members: { roster_member_id: string; display_name: string }[];
  cells: DashboardCarryOverCell[];
}

export interface DashboardMemberMomentum {
  roster_member_id: string;
  display_name: string;
  paused: boolean;
  sessions_expected: number;
  sessions_responded: number;
  response_rate_pct: number | null;
  tasks_done: number;
  done_by_day: { date: string; count: number }[];
  carry_overs: number;
  blockers_reported: number;
  blockers_resolved: number;
}

export interface DashboardData {
  range: { days: DashboardRangeDays; start: string; end: string };
  has_data: boolean;
  follow_ups_enabled: boolean;
  kpis: DashboardKpis;
  participation: {
    by_day: DashboardParticipationPoint[];
    by_agent: DashboardAgentParticipation[];
  };
  blockers: DashboardBlockerStats;
  carry_over: DashboardCarryOverGrid;
  members: DashboardMemberMomentum[];
}
