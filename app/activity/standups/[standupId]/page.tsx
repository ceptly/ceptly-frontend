import { redirect } from "next/navigation";

import { standupAgentHref } from "@/lib/agents";

interface StandupActivityRedirectProps {
  params: Promise<{ standupId: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function StandupActivityRedirect({
  params,
  searchParams,
}: StandupActivityRedirectProps) {
  const { standupId } = await params;
  const { edit } = await searchParams;
  redirect(standupAgentHref(standupId, edit === "1"));
}
