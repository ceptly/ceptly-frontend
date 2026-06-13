import {
  normalizeAssistantBullets,
  splitTextWithIssueLinkSegments,
} from "@/lib/chat-issue-links";
import { cn } from "@/lib/utils";

interface AssistantMessageContentProps {
  content: string;
  className?: string;
}

export function AssistantMessageContent({
  content,
  className,
}: AssistantMessageContentProps) {
  const normalizedContent = normalizeAssistantBullets(content);
  const segments = splitTextWithIssueLinkSegments(normalizedContent);

  if (segments.length === 1 && segments[0]?.type === "text") {
    return (
      <p className={cn("whitespace-pre-wrap", className)}>{normalizedContent}</p>
    );
  }

  return (
    <p className={cn("whitespace-pre-wrap", className)}>
      {segments.map((segment, index) =>
        segment.type === "issue" ? (
          <span key={`issue-${index}`}>
            <a
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              [{segment.identifier}]
            </a>
            {segment.title ? ` ${segment.title}` : null}
          </span>
        ) : (
          <span key={`text-${index}`}>{segment.content}</span>
        ),
      )}
    </p>
  );
}
