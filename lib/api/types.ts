export type UserRole = "founder" | "lead" | "ic";

export interface User {
  id: string;
  slack_id: string;
  name: string;
  role: UserRole;
  workspace_id: string;
  timezone?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slack_team_id?: string;
}

export interface AuthMeResponse {
  user: User;
  workspace: Workspace;
}

export interface AuthCallbackResponse {
  token: string;
  user: User;
  workspace: Workspace;
}

export interface SessionPayload {
  token: string;
  user: User;
  workspace: Workspace;
}
