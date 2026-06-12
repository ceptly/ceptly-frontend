"use client";

import { useRouter } from "next/navigation";

import { AgentDeployFields } from "@/components/agents/agent-deploy-fields";
import type { AgentDeployInitialValues, AgentEditTarget } from "@/lib/agents";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type {
  ChatChannel,
  CommunicationPlatform,
} from "@/lib/api/communication";
import type { AppContextOption } from "@/lib/api/types";
import type { PersonaOption } from "@/lib/api/personas";

interface AgentEditFieldsProps {
  workspaceId: string;
  workspaceTimezone: string;
  personas?: PersonaOption[];
  rosterMembers: RosterMember[];
  appContextOptions: AppContextOption[];
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
  chatChannels: ChatChannel[];
  communicationPlatform: CommunicationPlatform;
  chatChannelsError?: string | null;
  editTarget: AgentEditTarget;
  initialValues: AgentDeployInitialValues;
  /** Where to return after saving or cancelling the edit. */
  closeHref: string;
}

export function AgentEditFields({ closeHref, ...props }: AgentEditFieldsProps) {
  const router = useRouter();

  return (
    <AgentDeployFields
      {...props}
      onCloseEdit={() => {
        router.push(closeHref);
        router.refresh();
      }}
    />
  );
}
