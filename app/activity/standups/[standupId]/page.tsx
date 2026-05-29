import Link from "next/link";
import { redirect } from "next/navigation";

import { StandupSessionDetailView } from "@/components/activity/standup-session-detail";
import { buttonVariants } from "@/components/ui/button";
import {
  getStandupSessionDetail,
  listStandupSessions,
  listStandups,
} from "@/lib/api/standups";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface StandupActivityPageProps {
  params: Promise<{ standupId: string }>;
}

export default async function StandupActivityPage({
  params,
}: StandupActivityPageProps) {
  const { standupId } = await params;
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!canManageWorkspace(workspace?.role)) {
    redirect("/chat");
  }

  const token = await getAccessToken();
  if (!workspace?.id || !token) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        Could not load standup.
      </p>
    );
  }

  const standupsResult = await listStandups(token, workspace.id);
  const standup = standupsResult.data?.standups.find(
    (item) => item.id === standupId,
  );

  if (!standupsResult.success || !standup) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        {standupsResult.error ?? "Standup not found."}
      </p>
    );
  }

  const sessionsResult = await listStandupSessions(
    token,
    workspace.id,
    standupId,
  );
  const sessions = sessionsResult.data?.sessions ?? [];
  const firstSessionId = sessions[0]?.session_id;

  const initialDetailResult = firstSessionId
    ? await getStandupSessionDetail(
        token,
        workspace.id,
        standupId,
        firstSessionId,
      )
    : null;
  const initialSession = initialDetailResult?.data?.session ?? null;

  const channelLabel = standup.slack_channel_name
    ? `#${standup.slack_channel_name}`
    : standup.slack_channel_id;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-2">
        <Link
          href="/activity"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-0")}
        >
          ← Activity
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{standup.name}</h1>
        <p className="text-sm text-muted-foreground">
          {channelLabel} · {standup.members.length} participants
        </p>
      </div>

      {!sessionsResult.success ? (
        <p className="text-sm text-muted-foreground">
          {sessionsResult.error ?? "Could not load sessions."}
        </p>
      ) : (
        <StandupSessionDetailView
          workspaceId={workspace.id}
          standupId={standupId}
          sessions={sessions}
          initialSession={initialSession}
        />
      )}
    </div>
  );
}
