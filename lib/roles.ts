import type { WorkspaceMembership } from "@/lib/api/types";

const ROLE_LABELS: Record<WorkspaceMembership["role"], string> = {
  owner: "Workspace owner",
  admin: "Admin",
  member: "Member",
};

export const BILLING_ROLES = new Set<WorkspaceMembership["role"]>([
  "owner",
  "admin",
]);

export const WORKSPACE_MANAGE_ROLES = new Set<WorkspaceMembership["role"]>([
  "owner",
  "admin",
  "member",
]);

export function canManageBilling(
  role: WorkspaceMembership["role"] | undefined,
): boolean {
  return role ? BILLING_ROLES.has(role) : false;
}

export function canManageWorkspace(
  role: WorkspaceMembership["role"] | undefined,
): boolean {
  return role ? WORKSPACE_MANAGE_ROLES.has(role) : false;
}

export function roleCountsTowardSeats(
  role: WorkspaceMembership["role"],
): boolean {
  return role === "owner" || role === "admin";
}

export function formatWorkspaceRole(role: WorkspaceMembership["role"]): string {
  return ROLE_LABELS[role];
}
