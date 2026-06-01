"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getVisibleSettingsNavItems,
  isSettingsNavActive,
} from "@/lib/settings-nav";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
  showBilling: boolean;
}

export function SettingsSidebar({ showBilling }: SettingsSidebarProps) {
  const pathname = usePathname();
  const visibleSettingsNavItems = getVisibleSettingsNavItems(showBilling);

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border py-5 pl-3 pr-3 md:flex">
      <nav className="flex flex-col gap-0.5">
        {visibleSettingsNavItems.map((item) => {
          const active = isSettingsNavActive(pathname, item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-none px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-muted text-foreground [&_svg]:text-[color:var(--green-ink)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:text-muted-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
