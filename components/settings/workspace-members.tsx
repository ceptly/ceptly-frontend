"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/actions/members";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkspaceMember } from "@/lib/api/types";
import { formatWorkspaceRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

const EDITABLE_ROLES = ["admin", "lead", "ic"] as const;

interface WorkspaceMembersProps {
  workspaceId: string;
  canEdit: boolean;
  currentUserId: string;
  members: WorkspaceMember[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function displayName(member: WorkspaceMember): string {
  return member.full_name?.trim() || member.email.split("@")[0] || member.email;
}

export function WorkspaceMembersTable({
  workspaceId,
  canEdit,
  currentUserId,
  members,
}: WorkspaceMembersProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, role: "admin" | "lead" | "ic") => {
    setActionError(null);
    startTransition(async () => {
      const result = await updateMemberRoleAction(workspaceId, userId, role);
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const handleRemove = (userId: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await removeMemberAction(workspaceId, userId);
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 dark:border-white/10">
      <h2 className="text-base font-semibold">Workspace members</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        People who have access to this Ceptly workspace.
      </p>

      {actionError ? (
        <p className="mt-3 text-sm text-destructive">{actionError}</p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-lg border border-border dark:border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {canEdit ? <TableHead className="w-[100px]">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length ? (
              members.map((member) => {
                const isSelf = member.user_id === currentUserId;
                const isFounder = member.role === "founder";
                const canManageMember =
                  canEdit && !isSelf && !isFounder && !isPending;

                return (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{displayName(member)}</span>
                        {isSelf ? (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      {canManageMember ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.user_id,
                              e.target.value as "admin" | "lead" | "ic",
                            )
                          }
                          disabled={isPending}
                          className={cn(
                            "h-9 rounded-md border border-input bg-background px-3 text-sm",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          )}
                        >
                          {EDITABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {formatWorkspaceRole(role)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        formatWorkspaceRole(member.role)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.joined_at)}
                    </TableCell>
                    {canEdit ? (
                      <TableCell>
                        {canManageMember ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemove(member.user_id)}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </>
                            )}
                          </Button>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 5 : 4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No workspace members yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
