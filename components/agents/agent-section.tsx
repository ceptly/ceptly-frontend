"use client";

import type { ReactNode } from "react";

import { agentSectionTitleClass } from "@/lib/agents-ui";
import { cn } from "@/lib/utils";

interface AgentSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function AgentSection({ title, children, className }: AgentSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3.5", className)}>
      <h2 className={agentSectionTitleClass}>{title}</h2>
      {children}
    </section>
  );
}

export function AgentDivider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border", className)} />;
}
