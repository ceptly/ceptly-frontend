"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeCookieSync } from "@/components/theme-cookie-sync";
import { DEFAULT_THEME, type ThemePreference } from "@/lib/theme";

export function Providers({
  children,
  initialTheme = DEFAULT_THEME,
}: {
  children: React.ReactNode;
  initialTheme?: ThemePreference;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={initialTheme}
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      <ThemeCookieSync />
      {children}
    </ThemeProvider>
  );
}
