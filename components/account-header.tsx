"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut, User, Settings, Network } from "lucide-react";
import { useTheme } from "next-themes";
import { useStatsigClient } from "@statsig/react-bindings";

import { fetchActivityAttentionCount } from "@/actions/activity";
import { signOut } from "@/actions/auth";
import type { AuthUser } from "@/lib/api/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canManageWorkspace } from "@/lib/roles";
import { getVisibleSettingsNavItems } from "@/lib/settings-nav";
import { cn } from "@/lib/utils";

const baseNavigationItems = [
  { label: "Chat", path: "/chat", prefetch: true },
  { label: "Activity", path: "/activity", leadershipOnly: true, prefetch: false },
  // {
  //   label: "Context",
  //   path: "/context",
  //   leadershipOnly: true,
  //   prefetch: false,
  //   mobileHidden: true,
  // },
  {
    label: "Org intelligence",
    path: "/team",
    prefetch: false,
    mobileHidden: true,
  },
  {
    label: "Settings",
    path: "/settings",
    matchPrefix: "/settings",
    prefetch: false,
    mobileHidden: true,
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

function getDisplayName(user: AuthUser) {
  return user.fullName?.trim() || user.email;
}

interface AccountHeaderProps {
  user: AuthUser;
  showBilling?: boolean;
}

export function AccountHeader({ user, showBilling = false }: AccountHeaderProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { client } = useStatsigClient();
  const [attentionCount, setAttentionCount] = useState(0);

  const workspace = user.workspaces?.[0];
  const showActivity = canManageWorkspace(workspace?.role);
  const navigationItems = baseNavigationItems.filter(
    (item) => !item.leadershipOnly || showActivity,
  );
  const mobileSettingsNavItems = getVisibleSettingsNavItems(showBilling).filter(
    (item) =>
      item.href !== "/settings" && item.href !== "/settings/account",
  );

  useEffect(() => {
    if (!showActivity || !workspace?.id) {
      return;
    }

    void fetchActivityAttentionCount({ workspaceId: workspace.id }).then(
      setAttentionCount,
    );
  }, [showActivity, workspace?.id]);

  if (pathname.startsWith("/auth")) {
    return null;
  }

  const handleSignOut = () => {
    client.logEvent("sign_out_click");
    void signOut();
  };

  const workspaceName = user.workspaces?.[0]?.name ?? "My Team";
  const logoSrc =
    (resolvedTheme ?? theme) === "light"
      ? "/parallax-light.png"
      : "/parallax-dark.png";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/92 backdrop-blur-xl md:hidden">
      <div className="mx-auto max-w-[1180px] px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[22px]">
            <Link
              href="/chat"
              prefetch
              className="block size-[30px] shrink-0 cursor-pointer"
              onClick={() => client.logEvent("logo_click")}
            >
              <Image
                src={logoSrc}
                alt="Ceptly"
                width={30}
                height={30}
                className="size-[30px] object-contain"
              />
            </Link>

            <nav className="flex items-center gap-0.5">
              <Link
                href="/settings"
                prefetch={false}
                className="ceptly-nav-link ceptly-nav-ws"
                data-active="false"
                onClick={() => client.logEvent("workspace_nav_click")}
              >
                {workspaceName}
              </Link>
              {navigationItems.map((item) => {
                const active = pathname.startsWith(
                  item.matchPrefix ?? item.path,
                );

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    prefetch={item.prefetch}
                    className={cn(
                      "ceptly-nav-link",
                      "mobileHidden" in item &&
                        item.mobileHidden &&
                        "hidden md:inline",
                    )}
                    data-active={active ? "true" : "false"}
                    onClick={() =>
                      client.logEvent("navigation_click", item.path)
                    }
                  >
                    {item.label}
                    {item.path === "/activity" &&
                    attentionCount > 0 &&
                    !active ? (
                      <span
                        className={cn(
                          "ceptly-nav-badge",
                          attentionCount <= 9 && "ceptly-nav-badge-single",
                        )}
                      >
                        {attentionCount > 9 ? "9+" : attentionCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="relative size-9 rounded-full p-0"
                />
              }
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary text-[13px] font-bold tracking-wide text-primary-foreground">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[232px] rounded-none p-1.5" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2.5 py-2 font-normal">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[13px] leading-none font-semibold">
                      {getDisplayName(user)}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {/* {showActivity ? (
                <DropdownMenuItem
                  className="gap-2.5 rounded-none px-2.5 py-2 text-[13px] md:hidden"
                  render={
                    <Link
                      href="/context"
                      prefetch={false}
                      onClick={() =>
                        client.logEvent("navigation_click", "/context")
                      }
                    />
                  }
                >
                  <Brain className="size-[15px] text-muted-foreground" />
                  <span>Context</span>
                </DropdownMenuItem>
              ) : null} */}
              <DropdownMenuItem
                className="gap-2.5 rounded-none px-2.5 py-2 text-[13px] md:hidden"
                render={
                  <Link
                    href="/team"
                    prefetch={false}
                    onClick={() => client.logEvent("navigation_click", "/team")}
                  />
                }
              >
                <Network className="size-[15px] text-muted-foreground" />
                <span>Org intelligence</span>
              </DropdownMenuItem>
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
                <Settings className="size-[15px] text-muted-foreground" />
                <span>Workspace settings</span>
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
                <span>Account settings</span>
              </DropdownMenuItem>
              {mobileSettingsNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <DropdownMenuItem
                    key={item.href}
                    className="gap-2.5 rounded-none px-2.5 py-2 text-[13px] md:hidden"
                    render={
                      <Link
                        href={item.href}
                        prefetch={false}
                        onClick={() =>
                          client.logEvent("settings_nav_click", item.href)
                        }
                      />
                    }
                  >
                    <Icon className="size-[15px] text-muted-foreground" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                );
              })}
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
      </div>
    </header>
  );
}
