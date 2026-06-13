import { redirect } from "next/navigation";

export default function NewConversationSettingsRedirect() {
  redirect("/agents/new");
}
