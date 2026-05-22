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
  role: "founder" | "admin" | "lead" | "ic";
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
