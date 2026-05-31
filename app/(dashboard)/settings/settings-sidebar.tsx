"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Hash, Plug, Settings2, User } from "lucide-react";

import { cn } from "@/lib/utils";

const baseSettingsNavItems = [
  {
    label: "Workspace settings",
    href: "/settings",
    icon: Settings2,
    exact: true,
  },
  {
    label: "Account",
    href: "/settings/account",
    icon: User,
    exact: false,
  },
  {
    label: "Integrations",
    href: "/settings/integrations",
    icon: Plug,
    exact: false,
  },
  {
    label: "Channel standups",
    href: "/settings/standups",
    icon: Hash,
    exact: false,
  },
  {
    label: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    exact: false,
    billingOnly: true,
  },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SettingsSidebarProps {
  showBilling: boolean;
}

export function SettingsSidebar({ showBilling }: SettingsSidebarProps) {
  const pathname = usePathname();
  const settingsNavItems = baseSettingsNavItems.filter(
    (item) => !("billingOnly" in item && item.billingOnly) || showBilling,
  );

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border py-5 pl-3 pr-3">
      <nav className="flex flex-col gap-0.5">
        {settingsNavItems.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
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
