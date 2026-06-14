"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Pencil, Play, Trash2 } from "lucide-react";

import { deleteAgentAction, setAgentEnabledAction } from "@/actions/agents";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { agentHref } from "@/lib/agents";
import { cn } from "@/lib/utils";

interface AgentDetailActionsProps {
  workspaceId: string;
  agentId: string;
  agentName: string;
  enabled: boolean;
}

export function AgentDetailActions({
  workspaceId,
  agentId,
  agentName,
  enabled,
}: AgentDetailActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isToggling, startToggle] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    setError(null);
    startToggle(async () => {
      const result = await setAgentEnabledAction({
        workspaceId,
        agentId,
        enabled: !enabled,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setError(null);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteAgentAction({ workspaceId, agentId });
      if (result.error) {
        setError(result.error);
        setConfirmDelete(false);
        return;
      }
      router.push("/agents");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={agentHref(agentId, true)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Pencil className="size-3.5" />
          Edit
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggle}
          disabled={isToggling}
        >
          {isToggling ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : enabled ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5" />
          )}
          {enabled ? "Pause" : "Resume"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          Delete
        </Button>
      </div>

      {confirmDelete ? (
        <Alert variant="destructive">
          <AlertDescription className="space-y-3">
            <p>
              Delete <span className="font-medium">{agentName}</span>? This
              cannot be undone.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, delete"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
