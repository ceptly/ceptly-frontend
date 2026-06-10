"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AgentDeployFields } from "@/components/agents/agent-deploy-fields";
import type { DeployAgentType } from "@/lib/agents";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type {
  ChatChannel,
  CommunicationPlatform,
} from "@/lib/api/communication";
import type { AppContextOption, ConversationTemplate } from "@/lib/api/types";
import type { PersonaOption } from "@/lib/api/personas";

interface AgentDeployFormProps {
  workspaceId: string;
  workspaceTimezone: string;
  personas?: PersonaOption[];
  templates: ConversationTemplate[];
  rosterMembers: RosterMember[];
  appContextOptions: AppContextOption[];
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
  chatChannels: ChatChannel[];
  communicationPlatform: CommunicationPlatform;
  chatChannelsError?: string | null;
  initialType?: DeployAgentType;
}

export function AgentDeployForm(props: AgentDeployFormProps) {
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        className="ceptly-back"
        onClick={() => router.push("/agents")}
      >
        <ArrowLeft className="size-[15px]" /> Agents
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-[11px] font-bold tracking-widest text-[color:var(--green-ink)] uppercase">
            New agent
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-[26px] font-normal tracking-tight">
            Deploy an agent
          </h1>
          <p className="mt-1.5 max-w-[52ch] text-[13.5px] leading-relaxed text-muted-foreground">
            Configure the agent on the left — the preview shows the first message
            it&apos;ll send and a summary of what you&apos;re shipping.
          </p>
        </div>
      </div>

      <AgentDeployFields {...props} />
    </>
  );
}
