import { Suspense } from "react";

import { ChatPageContent } from "@/components/chat/chat-page-content";
import { ChatPageSkeleton } from "@/components/page-skeletons";
import { requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function ChatPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? canManageWorkspace(workspace.role) : false;

  return (
    <Suspense fallback={<ChatPageSkeleton />}>
      <ChatPageContent workspaceId={workspace?.id} canEdit={canEdit} />
    </Suspense>
  );
}
