import { redirect } from "next/navigation";

interface ConversationEditRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationEditSettingsRedirect({
  params,
}: ConversationEditRedirectProps) {
  const { id } = await params;
  redirect(`/agents/${id}?edit=1`);
}
