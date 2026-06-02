import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AgentsList } from "@/components/agents/agents-list";
import { listConversations } from "@/lib/api/conversations";
import { listStandups } from "@/lib/api/standups";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function AgentsPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!workspace?.id) {
    redirect("/chat");
  }
  if (!canManageWorkspace(workspace.role)) {
    redirect("/chat");
  }

  const token = await getAccessToken();
  if (!token) {
    redirect("/auth");
  }

  const [conversationsResult, standupsResult] = await Promise.all([
    listConversations(token, workspace.id, { includeMembers: true }),
    listStandups(token, workspace.id),
  ]);

  const conversations = conversationsResult.data?.conversations ?? [];
  const standups = standupsResult.data?.standups ?? [];
  const loadError =
    (!conversationsResult.success && conversationsResult.error) ||
    (!standupsResult.success && standupsResult.error) ||
    null;

  return (
    <Suspense>
      {loadError ? (
        <div className="ceptly-page">
          <div className="ag-head">
            <div>
              <h1>Agents</h1>
              <p>{loadError}</p>
            </div>
          </div>
        </div>
      ) : (
        <AgentsList
          workspaceId={workspace.id}
          conversations={conversations}
          standups={standups}
        />
      )}
    </Suspense>
  );
}
