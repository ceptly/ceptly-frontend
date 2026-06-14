"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, PauseCircle, Play, Plus } from "lucide-react";

import { ActivityRollupCard } from "@/components/activity/activity-rollup-card";
import { AgentDeployedDialog } from "@/components/agents/agent-deployed-dialog";
import { Button } from "@/components/ui/button";
import { rollupStatusFromCounts } from "@/lib/activity/rollup-card";
import { formatSchedulePreview } from "@/lib/schedule/preview";
import type { ActivityAgent } from "@/lib/api/types";

interface AgentsOverviewProps {
  agents: ActivityAgent[];
}

function agentSubtitle(agent: ActivityAgent): string {
  if (!agent.enabled) return "Paused";
  if (agent.destination === "channel" && agent.channel_id) {
    const styleLabel = agent.style === "broadcast" ? "Broadcast" : "Sequential";
    return `#${agent.channel_id} · ${styleLabel}`;
  }
  return formatSchedulePreview(
    agent.time_local,
    agent.timezone,
    agent.frequency,
    agent.days_of_week,
    agent.enabled,
  );
}

function AgentCard({ agent }: { agent: ActivityAgent }) {
  const session = agent.latest_session;
  const responded = session?.responded_count ?? 0;
  const expected = session?.expected_count ?? 0;
  const progress = expected > 0 ? Math.round((responded / expected) * 100) : 0;
  const status = rollupStatusFromCounts(
    responded,
    expected,
    session !== null,
    agent.missing_members.length,
  );
  const summaryText =
    session?.summary_text?.trim() ||
    (agent.missing_members.length > 0
      ? `Waiting on ${agent.missing_members.map((m) => m.display_name).join(", ")}.`
      : null);
  const emptyMessage =
    agent.destination === "channel"
      ? "No sessions yet. Results appear after the schedule fires."
      : "No conversation runs yet. Results appear after the schedule fires.";

  return (
    <ActivityRollupCard
      href={`/agents/${agent.id}`}
      title={agent.name}
      subtitle={agentSubtitle(agent)}
      status={status}
      latestAt={session?.started_at ?? null}
      responded={responded}
      expected={expected}
      progressPercent={progress}
      summary={summaryText}
      emptyMessage={emptyMessage}
      pastSessionsCount={agent.session_count}
    />
  );
}

function AgentSection({
  title,
  icon: Icon,
  items,
  emptyMessage,
}: {
  title: string;
  icon: typeof Play;
  items: ActivityAgent[];
  emptyMessage: string;
}) {
  return (
    <section className="ceptly-section">
      <div className="ceptly-section-head">
        <div className="ceptly-section-title font-sans font-normal">
          <Icon aria-hidden />
          {title}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="ceptly-card-empty not-italic">{emptyMessage}</p>
      ) : (
        <div className="ceptly-rollup-card-grid">
          {items.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </section>
  );
}

export function AgentsOverview({ agents }: AgentsOverviewProps) {
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
    return {
      activeAgents: agents.filter((a) => a.enabled),
      pausedAgents: agents.filter((a) => !a.enabled),
    };
  }, [agents]);

  const hasAgents = agents.length > 0;

  return (
    <div className="ceptly-page">
      <div className="ag-head">
        <div>
          <h1>Agents</h1>
          <p>
            Autonomous agents Ceptly runs on your behalf — scheduled conversation
            DMs and channel meetings.
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
            Deploy a scheduled conversation or a channel meeting and it will show up
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
