import { splitTextWithMentionSegments } from "@/lib/chat-mentions";
import type { RosterMember } from "@/lib/api/roster";
import { cn } from "@/lib/utils";

interface MentionMessageContentProps {
  content: string;
  rosterMembers?: RosterMember[];
  className?: string;
  mentionClassName?: string;
}

export function MentionMessageContent({
  content,
  rosterMembers = [],
  className,
  mentionClassName,
}: MentionMessageContentProps) {
  const segments = splitTextWithMentionSegments(content, rosterMembers);

  if (segments.length === 0) {
    return <p className={cn("whitespace-pre-wrap", className)}>{content}</p>;
  }

  return (
    <p className={cn("whitespace-pre-wrap", className)}>
      {segments.map((segment, index) =>
        segment.type === "mention" ? (
          <span
            key={`mention-${index}`}
            className={cn("text-[#56FF3C]", mentionClassName)}
          >
            {segment.content}
          </span>
        ) : (
          <span key={`text-${index}`}>{segment.content}</span>
        ),
      )}
    </p>
  );
}
