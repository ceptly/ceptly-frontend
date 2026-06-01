import type { Metadata } from "next";
import { Suspense } from "react";
import { Aldrich, Geist_Mono, Open_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { AccountHeader } from "@/components/account-header";
import { AccountHeaderSkeleton } from "@/components/account-header-skeleton";
import { Providers } from "@/components/providers";
import { StatsigIdentify } from "@/components/statsig-identify";
import { getCurrentUser } from "@/lib/auth/server";
import { THEME_COOKIE_NAME, resolveTheme } from "@/lib/theme";
import { THEME_COOKIE_SEED_SCRIPT } from "@/lib/theme-cookie-script";
import { cn } from "@/lib/utils";
import { createSiteMetadata } from "@/lib/site-metadata";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
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

const aldrich = Aldrich({
  variable: "--font-aldrich",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = createSiteMetadata();

async function AccountHeaderSlot() {
  const [user, cookieStore] = await Promise.all([
    getCurrentUser(),
    cookies(),
  ]);
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
        className={`${openSans.variable} ${geistMono.variable} ${aldrich.variable} min-h-full flex flex-col antialiased bg-background text-foreground`}
      >
        <script
          dangerouslySetInnerHTML={{ __html: THEME_COOKIE_SEED_SCRIPT }}
        />
        <MyStatsig>
          <Analytics />
          <Providers initialTheme={initialTheme}>
            {hideHeader ? null : (
              <Suspense fallback={<AccountHeaderSkeleton />}>
                <AccountHeaderSlot />
              </Suspense>
            )}
            <main className="flex flex-1 flex-col">{children}</main>
          </Providers>
        </MyStatsig>
      </body>
    </html>
  );
}
