import { EmployeeChatPrompt } from "@/components/employee-chat-prompt";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What do you want to know about your team?
        </h1>
        <EmployeeChatPrompt />
      </main>
    </div>
  );
}
