"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import { removeConversation } from "@/actions/conversations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConversationDetailActionsProps {
  workspaceId: string;
  conversationId: string;
  conversationName: string;
  canDelete: boolean;
}

export function ConversationDetailActions({
  workspaceId,
  conversationId,
  conversationName,
  canDelete,
}: ConversationDetailActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!canDelete) {
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      setError(null);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await removeConversation({
        workspaceId,
        conversationId,
      });

      if (result.error) {
        setError(result.error);
        setConfirmDelete(false);
        return;
      }

      router.push("/activity");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/activity/${conversationId}?edit=1`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Pencil className="size-3.5" />
          Edit
        </Link>
        {canDelete ? (
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
        ) : null}
      </div>

      {confirmDelete ? (
        <Alert variant="destructive">
          <AlertDescription className="space-y-3">
            <p>
              Delete <span className="font-medium">{conversationName}</span>?
              This cannot be undone.
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

      {!canDelete ? (
        <p className="text-sm text-muted-foreground">
          You need at least one scheduled conversation. Create another before
          deleting this one.
        </p>
      ) : null}
    </div>
  );
}
