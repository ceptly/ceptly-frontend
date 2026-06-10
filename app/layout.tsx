import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Crimson_Pro,
  Crimson_Text,
  Geist_Mono,
  Open_Sans,
} from "next/font/google";
import { cookies, headers } from "next/headers";
import { AccountHeader } from "@/components/account-header";
import { AppNavSkeleton } from "@/components/app-nav-skeleton";
import { AppSidebar } from "@/components/app-sidebar";
import { PostHogIdentify } from "@/components/posthog-identify";
import { Providers } from "@/components/providers";
import { StatsigIdentify } from "@/components/statsig-identify";
import { getCurrentUser } from "@/lib/auth/server";
import { THEME_COOKIE_NAME, resolveTheme } from "@/lib/theme";
import { THEME_COOKIE_SEED_SCRIPT } from "@/lib/theme-cookie-script";
import { cn } from "@/lib/utils";
import { createSiteMetadata } from "@/lib/site-metadata";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import MyStatsig from "./my-statsig";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Purple Ceptly design system: Crimson Text serif headings + Crimson Pro wordmark.
const crimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = createSiteMetadata();

async function AppNavSlot() {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  if (!user) {
    return null;
  }

  const showBilling = cookieStore.get("billing_can_manage")?.value === "1";

  return (
    <>
      <StatsigIdentify
        userId={user.id}
        email={user.email}
        fullName={user.fullName ?? undefined}
      />
      <PostHogIdentify
        userId={user.id}
        email={user.email}
        fullName={user.fullName ?? undefined}
      />
      {/* Desktop: left sidebar replaces the top header. */}
      <AppSidebar user={user} className="hidden md:flex" />
      {/* Mobile: top header (unchanged) — hidden on desktop. */}
      <AccountHeader user={user} showBilling={showBilling} />
    </>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const pathname = headersList.get("x-pathname") ?? "";
  const hideHeader =
    pathname.startsWith("/auth") || pathname.startsWith("/onboarding");
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", initialTheme === "dark" && "dark")}
    >
      <body
        className={`${openSans.variable} ${geistMono.variable} ${crimsonText.variable} ${crimsonPro.variable} min-h-full flex flex-col md:flex-row antialiased bg-background text-foreground`}
      >
        <script
          dangerouslySetInnerHTML={{ __html: THEME_COOKIE_SEED_SCRIPT }}
        />
        <MyStatsig>
          <Analytics />
          <SpeedInsights />
          <Providers initialTheme={initialTheme}>
            {hideHeader ? null : (
              <Suspense fallback={<AppNavSkeleton />}>
                <AppNavSlot />
              </Suspense>
            )}
            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
          </Providers>
        </MyStatsig>
      </body>
    </html>
  );
}
