import {
  CreditCard,
  Hash,
  Plug,
  Settings2,
  User,
  type LucideIcon,
} from "lucide-react";

export type SettingsNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  billingOnly?: boolean;
};

export const settingsNavItems: SettingsNavItem[] = [
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
  {
    label: "Integrations",
    href: "/settings/integrations",
    icon: Plug,
    exact: false,
  },
];

export function isSettingsNavActive(
  pathname: string,
  href: string,
  exact?: boolean,
) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getVisibleSettingsNavItems(showBilling: boolean) {
  return settingsNavItems.filter((item) => !item.billingOnly || showBilling);
}
