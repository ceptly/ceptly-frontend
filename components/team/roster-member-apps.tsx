"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

import type { RosterMember } from "@/lib/api/roster";
import { getIntegrationLogo } from "@/lib/integrations/logos";
import { cn } from "@/lib/utils";

const APP_LABELS: Record<string, string> = {
  slack: "Slack",
  linear: "Linear",
  jira: "Jira",
  monday: "Monday",
  teams: "Microsoft Teams",
};

interface RosterMemberAppsProps {
  sources: RosterMember["data_sources"];
  className?: string;
  iconClassName?: string;
}

export function RosterMemberApps({
  sources,
  className,
  iconClassName = "size-[18px] rounded-[3px] object-contain",
}: RosterMemberAppsProps) {
  const { resolvedTheme, theme } = useTheme();
  const logoTheme = (resolvedTheme ?? theme) === "dark" ? "dark" : "light";

  if (sources.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {sources.map((source) => {
        const logo = getIntegrationLogo(source, logoTheme);
        const label = APP_LABELS[source] ?? source;

        return logo ? (
          <Image
            key={source}
            src={logo}
            alt={label}
            title={label}
            width={18}
            height={18}
            className={iconClassName}
          />
        ) : (
          <span
            key={source}
            className="text-xs text-muted-foreground capitalize"
            title={label}
          >
            {label}
          </span>
        );
      })}
    </span>
  );
}

export function getRosterMemberInitials(displayName: string): string {
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}
