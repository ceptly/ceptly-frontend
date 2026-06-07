import { redirect } from "next/navigation";

import { ContextBrain } from "@/components/context/context-brain";
import { getCompanyContext } from "@/lib/api/context";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function ContextPage() {
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

  const result = await getCompanyContext(token, workspace.id);
  const context = result.data;
  const loadError =
    !result.success || !context
      ? (result.error ?? "Could not load company context.")
      : null;

  if (loadError || !context) {
    return (
      <div className="ceptly-page flex flex-col gap-8">
        <div className="ceptly-page-head">
          <h1 className="ceptly-page-title">Company context</h1>
          <p className="ceptly-page-sub">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <ContextBrain
      workspaceId={workspace.id}
      companyName={workspace.name ?? "your company"}
      initialContext={context}
      canEdit={canManageWorkspace(workspace.role)}
    />
  );
}
