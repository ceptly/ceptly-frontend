/** Matches backend listChatSessions preview truncation (80 chars). */
export function formatChatSessionPreview(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 80 ? trimmed.slice(0, 80) : trimmed;
}
