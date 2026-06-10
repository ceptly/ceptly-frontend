"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useStatsigClient } from "@statsig/react-bindings";
import {
  Activity,
  Bot,
  Brain,
  ChevronDown,
  ChevronsUpDown,
  LogOut,
  MessageSquare,
  Network,
  Settings,
  Settings2,
  User,
  type LucideIcon,
} from "lucide-react";

import { fetchActivityAttentionCount } from "@/actions/activity";
import { signOut } from "@/actions/auth";
import type { AuthUser } from "@/lib/api/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  matchPrefix?: string;
  leadershipOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "chat", label: "Chat", path: "/chat", icon: MessageSquare },
  {
    id: "activity",
    label: "Activity",
    path: "/activity",
    icon: Activity,
    leadershipOnly: true,
  },
  {
    id: "agents",
    label: "Agents",
    path: "/agents",
    icon: Bot,
    leadershipOnly: true,
  },
  {
    id: "context",
    label: "Context",
    path: "/context",
    icon: Brain,
    leadershipOnly: true,
  },
  { id: "team", label: "Org intelligence", path: "/team", icon: Network },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    matchPrefix: "/settings",
    icon: Settings,
  },
];

function getInitials(user: AuthUser) {
  const name = user.fullName?.trim() || user.email;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

interface AppSidebarProps {
  user: AuthUser;
  className?: string;
}

export function AppSidebar({ user, className }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { client } = useStatsigClient();
  const [mounted, setMounted] = useState(false);
  const [attentionCount, setAttentionCount] = useState(0);

  const workspace = user.workspaces?.[0];
  const showActivity = canManageWorkspace(workspace?.role);
  const workspaceName = workspace?.name ?? "My Team";
  const displayName = user.fullName?.trim() || user.email;

  const items = NAV_ITEMS.filter(
    (item) => !item.leadershipOnly || showActivity,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showActivity || !workspace?.id) {
      return;
    }
    void fetchActivityAttentionCount({ workspaceId: workspace.id }).then(
      setAttentionCount,
    );
  }, [showActivity, workspace?.id]);

  const logoSrc =
    mounted && (resolvedTheme ?? theme) === "light"
      ? "/parallax-light.png"
      : "/parallax-dark.png";

  const handleSignOut = () => {
    client.logEvent("sign_out_click");
    void signOut();
  };

  return (
    <aside
      className={cn(
        "sticky top-0 h-dvh w-[248px] shrink-0 flex-col self-start overflow-y-auto border-r border-border px-3 py-4",
        className,
      )}
      style={{
        background:
          "color-mix(in oklab, var(--background) 94%, var(--foreground) 2%)",
      }}
    >
      <Link
        href="/chat"
        prefetch
        className="flex cursor-pointer items-center gap-2.5 px-2 pt-1.5 pb-3.5"
        onClick={() => client.logEvent("logo_click")}
        title="Ceptly"
      >
        <Image
          src={logoSrc}
          alt="Ceptly"
          width={26}
          height={26}
          className="size-[26px] shrink-0 object-contain"
        />
        <span
          className="text-[19px] tracking-[0.01em] text-foreground"
          style={{ fontFamily: "var(--font-crimson-pro), ui-serif, serif" }}
        >
          Ceptly
        </span>
      </Link>

      <Link
        href="/settings"
        prefetch={false}
        className="mb-3.5 flex w-full items-center gap-[9px] border border-border px-2.5 py-[9px] text-left transition-colors hover:bg-muted"
        onClick={() => client.logEvent("workspace_nav_click")}
      >
        <span className="flex-1 truncate text-[13px] font-semibold">
          {workspaceName}
        </span>
        <ChevronDown className="size-[15px] shrink-0 text-muted-foreground" />
      </Link>

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname.startsWith(item.matchPrefix ?? item.path);
          const Icon = item.icon;
          const showBadge =
            item.id === "activity" && attentionCount > 0 && !active;

          return (
            <Link
              key={item.id}
              href={item.path}
              prefetch={item.id === "chat"}
              data-active={active ? "true" : "false"}
              className={cn(
                "group relative flex w-full items-center gap-[11px] px-[11px] py-[9px] text-left text-[13px] font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={() => client.logEvent("navigation_click", item.path)}
            >
              {active ? (
                <span
                  className="absolute top-[7px] bottom-[7px] left-0 w-0.5"
                  style={{ background: "var(--brand-green-soft)" }}
                />
              ) : null}
              <Icon
                className={cn(
                  "size-[17px] shrink-0",
                  active
                    ? "[color:var(--brand-green-soft)]"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {showBadge ? (
                <span
                  className="flex h-4 min-w-4 shrink-0 items-center justify-center px-1 text-[10px] font-bold text-white dark:text-[#18181b]"
                  style={{ background: "var(--destructive)" }}
                >
                  {attentionCount > 9 ? "9+" : attentionCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-2.5 border border-transparent px-2 py-2 text-left transition-colors hover:bg-muted aria-expanded:border-border aria-expanded:bg-muted"
          >
            <span className="ceptly-avatar ceptly-avatar-sm shrink-0">
              {getInitials(user)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[13px] font-semibold">
                {displayName}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </span>
            </span>
            <ChevronsUpDown className="size-[15px] shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--anchor-width) rounded-none p-1.5"
          >
            <DropdownMenuItem
              className="gap-2.5 rounded-none px-2.5 py-2 text-[13px]"
              render={
                <Link
                  href="/settings"
                  prefetch
                  onClick={() => client.logEvent("settings_click")}
                />
              }
            >
              <Settings2 className="size-[15px] text-muted-foreground" />
              <span>Team settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2.5 rounded-none px-2.5 py-2 text-[13px]"
              render={
                <Link
                  href="/settings/account"
                  prefetch
                  onClick={() => client.logEvent("account_settings_click")}
                />
              }
            >
              <User className="size-[15px] text-muted-foreground" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2.5 rounded-none px-2.5 py-2 text-[13px]"
              onClick={handleSignOut}
            >
              <LogOut className="size-[15px] text-muted-foreground" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
