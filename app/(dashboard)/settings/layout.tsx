import { SettingsSidebar } from "./settings-sidebar";
import { requireAuth } from "@/lib/auth/server";
import { getPrimaryWorkspace, userCanManageBilling } from "@/lib/subscription";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const workspace = getPrimaryWorkspace(user);
  const showBilling = userCanManageBilling(workspace);

  return (
    <div className="flex min-h-0 flex-1">
      <SettingsSidebar showBilling={showBilling} />
      <div className="flex min-w-0 flex-1 flex-col bg-muted/20">{children}</div>
    </div>
  );
}
