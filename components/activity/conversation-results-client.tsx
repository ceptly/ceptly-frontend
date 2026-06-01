"use client";

import { fetchConversationRunDetail } from "@/actions/conversation-results";
import { ConversationResultsView } from "@/components/activity/conversation-results-view";
import type {
  ConversationRunDetail,
  ConversationRunSummary,
} from "@/lib/api/types";

interface ConversationResultsClientProps {
  workspaceId: string;
  conversationId: string;
  conversationName: string;
  conversationSubtitle: string;
  runs: ConversationRunSummary[];
  initialRun: ConversationRunDetail | null;
}

export function ConversationResultsClient({
  workspaceId,
  conversationId,
  conversationName,
  conversationSubtitle,
  runs,
  initialRun,
}: ConversationResultsClientProps) {
  return (
    <ConversationResultsView
      conversationName={conversationName}
      conversationSubtitle={conversationSubtitle}
      runs={runs}
      initialRun={initialRun}
      onSelectRun={async (runId) => {
        const result = await fetchConversationRunDetail({
          workspaceId,
          conversationId,
          runId,
        });
        return result.run;
      }}
    />
  );
}
