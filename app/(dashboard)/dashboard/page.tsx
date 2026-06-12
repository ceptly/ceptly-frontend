import { Suspense } from "react";
import { redirect } from "next/navigation";

import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardPageContentSkeleton } from "@/components/page-skeletons";
import type { DashboardRangeDays } from "@/lib/api/types";
import { requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

function normalizeDays(
  value: string | string[] | undefined,
): DashboardRangeDays {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return parsed === 7 || parsed === 90 ? parsed : 30;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!canManageWorkspace(workspace?.role)) {
    redirect("/chat");
  }

  if (!workspace?.id) {
    return (
      <div className="ceptly-page">
        <p className="text-sm text-muted-foreground">
          Could not load the dashboard.
        </p>
      </div>
    );
  }

  const days = normalizeDays((await searchParams).days);

  return (
    <div className="ceptly-page">
      <Suspense key={days} fallback={<DashboardPageContentSkeleton />}>
        <DashboardContent workspaceId={workspace.id} days={days} />
      </Suspense>
    </div>
  );
}
