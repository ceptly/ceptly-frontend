import { Progress } from "@/components/ui/progress";
import type { DashboardAgentParticipation } from "@/lib/api/types";

interface ParticipationListProps {
  agents: DashboardAgentParticipation[];
}

export function ParticipationList({ agents }: ParticipationListProps) {
  if (agents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <div key={agent.agent_id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{agent.agent_name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {agent.responded}/{agent.expected} responses ·{" "}
              {agent.sessions} session{agent.sessions === 1 ? "" : "s"}
              {agent.response_rate_pct !== null
                ? ` · ${Math.round(agent.response_rate_pct)}%`
                : ""}
            </span>
          </div>
          <Progress value={agent.response_rate_pct ?? 0} />
        </div>
      ))}
    </div>
  );
}
