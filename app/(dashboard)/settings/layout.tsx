import { cookies } from "next/headers";

import { SettingsSidebar } from "./settings-sidebar";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const showBilling = cookieStore.get("billing_can_manage")?.value === "1";

  return (
    <div className="flex min-h-0 flex-1">
      <SettingsSidebar showBilling={showBilling} />
      <div className="flex min-w-0 flex-1 flex-col bg-muted/20">{children}</div>
    </div>
  );
}
