"use server";

import { cookies } from "next/headers";

import { THEME_COOKIE_NAME, parseThemeCookie } from "@/lib/theme";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setThemeCookieAction(theme: string) {
  const preference = parseThemeCookie(theme);
  if (!preference) {
    return;
  }

  const isSecure =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE_NAME, preference, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: isSecure,
  });
}
