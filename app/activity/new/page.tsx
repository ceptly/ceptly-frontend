import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { NewConversationContent } from "@/components/activity/new-conversation-content";
import { ConversationFormSkeleton } from "@/components/page-skeletons";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default async function NewActivityConversationPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!canManageWorkspace(workspace?.role)) {
    redirect("/chat");
  }

  if (!workspace?.id) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        Only workspace owners, admins, and members can create conversations.
      </p>
    );
  }

  const workspaceId = workspace.id;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <Link
          href="/activity"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 w-fit px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          &lt; Activity
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add conversation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start from a template, choose who receives check-in DMs, and where
            standup rollups are posted. A short summary is generated
            automatically after you publish.
          </p>
        </div>
      </div>

      <Suspense fallback={<ConversationFormSkeleton />}>
        <NewConversationContent workspaceId={workspaceId} />
      </Suspense>
    </div>
  );
}
