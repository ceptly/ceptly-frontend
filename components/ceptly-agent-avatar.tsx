"use client";

import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CeptlyAgentAvatarProps {
  className?: string;
}

export function CeptlyAgentAvatar({ className }: CeptlyAgentAvatarProps) {
  const { resolvedTheme } = useTheme();
  const logoSrc =
    resolvedTheme === "dark" ? "/ceptly-mark-light.png" : "/ceptly-mark.png";

  return (
    <Avatar size="sm" className={cn("mt-0.5", className)}>
      <AvatarImage
        src={logoSrc}
        alt="Ceptly"
        className="object-contain p-1.5"
      />
      <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
        C
      </AvatarFallback>
    </Avatar>
  );
}
