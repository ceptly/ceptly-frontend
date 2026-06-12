import { redirect } from "next/navigation";

export default async function ContextPage() {
  redirect("/chat");
}
