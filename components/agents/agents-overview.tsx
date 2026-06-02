"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, PauseCircle, Play, Plus } from "lucide-react";

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

type AgentListItem =
  | { kind: "standup"; standup: ActivityChannelStandup }
  | { kind: "checkin"; conversation: ActivityScheduledConversation };

function isAgentActive(item: AgentListItem): boolean {
  if (item.kind === "standup") {
    return item.standup.enabled !== false;
  }
  return item.conversation.enabled;
}

function AgentListCard({ item }: { item: AgentListItem }) {
  if (item.kind === "standup") {
    return <ActivityStandupCard standup={item.standup} />;
  }
  return <ActivityConversationCard conversation={item.conversation} />;
}

function AgentSection({
  title,
  icon: Icon,
  items,
  emptyMessage,
}: {
  title: string;
  icon: typeof Play;
  items: AgentListItem[];
  emptyMessage: string;
}) {
  return (
    <section className="ceptly-section">
      <div className="ceptly-section-head">
        <h2 className="ceptly-section-title">
          <Icon aria-hidden />
          {title}
        </h2>
      </div>
      {items.length === 0 ? (
        <p className="ceptly-card-empty not-italic">{emptyMessage}</p>
      ) : (
        <div className="ceptly-rollup-card-grid">
          {items.map((item) => (
            <AgentListCard
              key={
                item.kind === "standup"
                  ? item.standup.standup_id
                  : item.conversation.id
              }
              item={item}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function AgentsOverview({
  channelStandups,
  scheduledConversations,
}: AgentsOverviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [deployed, setDeployed] = useState(() =>
    Boolean(searchParams.get("deployed")),
  );

  useEffect(() => {
    if (!deployed) return;
    router.replace("/agents");
    const timer = setTimeout(() => setDeployed(false), 4200);
    return () => clearTimeout(timer);
  }, [deployed, router]);

  const { activeAgents, pausedAgents } = useMemo(() => {
    const all: AgentListItem[] = [
      ...channelStandups.map((standup) => ({
        kind: "standup" as const,
        standup,
      })),
      ...scheduledConversations.map((conversation) => ({
        kind: "checkin" as const,
        conversation,
      })),
    ];

    return {
      activeAgents: all.filter(isAgentActive),
      pausedAgents: all.filter((item) => !isAgentActive(item)),
    };
  }, [channelStandups, scheduledConversations]);

  const hasAgents = activeAgents.length > 0 || pausedAgents.length > 0;

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
          <AgentSection
            title="Active"
            icon={Play}
            items={activeAgents}
            emptyMessage="No active agents. Resume a paused agent or deploy a new one."
          />
          {pausedAgents.length > 0 ? (
            <AgentSection
              title="Paused"
              icon={PauseCircle}
              items={pausedAgents}
              emptyMessage="No paused agents."
            />
          ) : null}
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
