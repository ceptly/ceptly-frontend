import { redirect } from "next/navigation";

import { WorkspaceNameForm } from "@/components/settings/workspace-name-form";
import { getCurrentUser } from "@/lib/auth/server";

const ADMIN_ROLES = new Set(["founder", "admin"]);

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  const workspace = user.workspaces?.[0];
  const canEdit = workspace
    ? ADMIN_ROLES.has(workspace.role)
    : false;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace and account preferences.
        </p>
      </div>

      {workspace?.id ? (
        <WorkspaceNameForm
          workspaceId={workspace.id}
          initialName={workspace.name}
          canEdit={canEdit}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No workspace found for your account.
        </p>
      )}
    </div>
  );
}
