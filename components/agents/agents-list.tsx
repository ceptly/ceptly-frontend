"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  CalendarClock,
  Ellipsis,
  ExternalLink,
  Hash,
  Loader2,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

import {
  setConversationAgentEnabled,
  setStandupAgentEnabled,
} from "@/actions/agents";
import { removeConversation } from "@/actions/conversations";
import { deleteStandupAction } from "@/actions/standups";
import { AgentDeployedDialog } from "@/components/agents/agent-deployed-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AGENT_KINDS,
  type AgentKind,
  type AgentRow,
  conversationToAgentRow,
  standupToAgentRow,
} from "@/lib/agents";
import type { ScheduledConversation, Standup } from "@/lib/api/types";

const KIND_ICONS = {
  conversation: CalendarClock,
  standup: Hash,
} as const;

function kindLabel(kind: AgentKind) {
  return AGENT_KINDS.find((k) => k.id === kind)?.name ?? "Agent";
}

interface AgentsListProps {
  workspaceId: string;
  conversations: ScheduledConversation[];
  standups: Standup[];
}

export function AgentsList({
  workspaceId,
  conversations,
  standups,
}: AgentsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deployedKind = searchParams.get("deployed");

  const [deployed, setDeployed] = useState<AgentKind | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (deployedKind !== "conversation" && deployedKind !== "standup") return;
    setDeployed(deployedKind);
    router.replace("/agents");
    clearTimeout(dialogTimer.current);
    dialogTimer.current = setTimeout(() => setDeployed(null), 4200);
    return () => clearTimeout(dialogTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deployedKind]);

  const rows: AgentRow[] = [
    ...conversations.map(conversationToAgentRow),
    ...standups.map(standupToAgentRow),
  ];
  const live = rows.filter((a) => a.live);
  const paused = rows.filter((a) => !a.live);

  function toggle(agent: AgentRow) {
    setError(null);
    setPendingId(agent.id);
    const schedule = { ...agent.schedule, enabled: !agent.live };
    startTransition(async () => {
      const result =
        agent.kind === "conversation"
          ? await setConversationAgentEnabled({
              workspaceId,
              conversationId: agent.id,
              schedule,
            })
          : await setStandupAgentEnabled({
              workspaceId,
              standupId: agent.id,
              schedule,
            });
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(agent: AgentRow) {
    if (
      !window.confirm(
        `Delete "${agent.name}"? This stops the agent and removes it permanently.`,
      )
    ) {
      return;
    }
    setError(null);
    setPendingId(agent.id);
    startTransition(async () => {
      const result =
        agent.kind === "conversation"
          ? await removeConversation({
              workspaceId,
              conversationId: agent.id,
            })
          : await deleteStandupAction({ workspaceId, standupId: agent.id });
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function AgentRowView({ a }: { a: AgentRow }) {
    const Icon = KIND_ICONS[a.kind];
    const busy = pendingId === a.id && isPending;
    return (
      <div className="ag-agent-row">
        <span className="ag-agent-ico">
          <Icon className="size-[17px]" />
        </span>
        <div className="ag-agent-main">
          <div className="ag-agent-name">{a.name}</div>
          <div className="ag-agent-meta">
            <span className={"ag-dot" + (a.live ? "" : " paused")} />
            {a.live ? "Active" : "Paused"} · {a.meta}
          </div>
        </div>
        <div className="ag-agent-actions">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={busy}
            aria-label={a.live ? "Pause agent" : "Resume agent"}
            onClick={() => toggle(a)}
          >
            {busy ? (
              <Loader2 className="size-[14px] animate-spin" />
            ) : a.live ? (
              <Pause className="size-[14px]" />
            ) : (
              <Play className="size-[14px]" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="More options"
                />
              }
            >
              <Ellipsis className="size-[14px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-none p-1.5">
              <DropdownMenuItem
                className="gap-2.5 rounded-none px-2.5 py-2 text-[13px]"
                render={<Link href={a.href} prefetch={false} />}
              >
                <ExternalLink className="size-[15px] text-muted-foreground" />
                <span>Manage</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="gap-2.5 rounded-none px-2.5 py-2 text-[13px]"
                onClick={() => remove(a)}
              >
                <Trash2 className="size-[15px]" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

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

      {error ? (
        <p className="mb-4 text-[13px] text-destructive">{error}</p>
      ) : null}

      {rows.length === 0 ? (
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
          <div className="ceptly-section">
            <div className="ceptly-section-title">
              <Bot /> Active <span className="ag-count">{live.length}</span>
            </div>
            {live.length ? (
              <div className="ceptly-list-card ag-active">
                {live.map((a) => (
                  <AgentRowView key={a.kind + a.id} a={a} />
                ))}
              </div>
            ) : (
              <p className="ceptly-card-empty">No active agents.</p>
            )}
          </div>

          {paused.length ? (
            <div className="ceptly-section">
              <div className="ceptly-section-title">
                <Pause /> Paused{" "}
                <span className="ag-count">{paused.length}</span>
              </div>
              <div className="ceptly-list-card ag-active">
                {paused.map((a) => (
                  <AgentRowView key={a.kind + a.id} a={a} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      {deployed ? (
        <AgentDeployedDialog
          name={kindLabel(deployed)}
          detail="Running on its schedule now."
          onClose={() => {
            clearTimeout(dialogTimer.current);
            setDeployed(null);
          }}
        />
      ) : null}
    </div>
  );
}
