"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, CalendarCheck, CalendarClock, Plus } from "lucide-react";

import { ActivityConversationCard } from "@/components/activity/activity-conversation-card";
import { ActivityStandupCard } from "@/components/activity/activity-standup-card";
import { AgentDeployedDialog } from "@/components/agents/agent-deployed-dialog";
import { Button } from "@/components/ui/button";
import type {
  ActivityChannelStandup,
  ActivityScheduledConversation,
} from "@/lib/api/types";

interface AgentsOverviewProps {
  channelStandups: ActivityChannelStandup[];
  scheduledConversations: ActivityScheduledConversation[];
}

export function AgentsOverview({
  channelStandups,
  scheduledConversations,
}: AgentsOverviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read the one-shot ?deployed flag once on mount so the confirmation persists
  // after we strip it from the URL below.
  const [deployed, setDeployed] = useState(() =>
    Boolean(searchParams.get("deployed")),
  );

  useEffect(() => {
    if (!deployed) return;
    router.replace("/agents");
    const timer = setTimeout(() => setDeployed(false), 4200);
    return () => clearTimeout(timer);
  }, [deployed, router]);

  const hasAgents =
    channelStandups.length > 0 || scheduledConversations.length > 0;

  return (
    <div className="ceptly-page">
      <div className="ag-head">
        <div>
          <h1>Agents</h1>
          <p>
            Autonomous agents Ceptly runs on your behalf — scheduled check-in
            DMs and channel standups.
          </p>
        </div>
        <Button onClick={() => router.push("/agents/new")}>
          <Plus className="size-[15px]" /> New agent
        </Button>
      </div>

      {!hasAgents ? (
        <div className="ceptly-list-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="ag-new-ico">
            <Bot className="size-[18px]" />
          </span>
          <div className="ag-agent-name">No agents yet</div>
          <p className="max-w-sm text-[13px] text-muted-foreground">
            Deploy a scheduled check-in or a channel standup and it will show up
            here, running on your behalf.
          </p>
          <Button className="mt-1" onClick={() => router.push("/agents/new")}>
            <Plus className="size-[15px]" /> Deploy your first agent
          </Button>
        </div>
      ) : (
        <>
          <section className="ceptly-section">
            <div className="ceptly-section-head">
              <h2 className="ceptly-section-title">
                <CalendarCheck aria-hidden />
                Standups
              </h2>
            </div>
            {channelStandups.length === 0 ? (
              <p className="ceptly-card-empty not-italic">
                No channel standups yet.
              </p>
            ) : (
              <div className="ceptly-rollup-card-grid">
                {channelStandups.map((standup) => (
                  <ActivityStandupCard
                    key={standup.standup_id}
                    standup={standup}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="ceptly-section">
            <div className="ceptly-section-head">
              <h2 className="ceptly-section-title">
                <CalendarClock aria-hidden />
                Scheduled check-ins
              </h2>
            </div>
            {scheduledConversations.length === 0 ? (
              <p className="ceptly-card-empty not-italic">
                No scheduled check-ins yet.
              </p>
            ) : (
              <div className="ceptly-rollup-card-grid">
                {scheduledConversations.map((conversation) => (
                  <ActivityConversationCard
                    key={conversation.id}
                    conversation={conversation}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {deployed ? (
        <AgentDeployedDialog
          name="Agent"
          detail="Running on its schedule now."
          onClose={() => setDeployed(false)}
        />
      ) : null}
    </div>
  );
}
