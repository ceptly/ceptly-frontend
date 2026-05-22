import { cookies } from "next/headers";

import { AUTH_ENDPOINTS, getApiBaseUrl } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/types";

function cookieOptions() {
  const isSecure =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? ("none" as const) : ("lax" as const),
    path: "/",
  };
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

export async function setAuthCookies(session: {
  access_token: string;
  refresh_token: string;
}) {
  const cookieStore = await cookies();
  const options = cookieOptions();

  cookieStore.set("access_token", session.access_token, {
    ...options,
    maxAge: 24 * 60 * 60,
  });

  cookieStore.set("refresh_token", session.refresh_token, {
    ...options,
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  const options = cookieOptions();

  cookieStore.set("access_token", "", { ...options, maxAge: 0 });
  cookieStore.set("refresh_token", "", { ...options, maxAge: 0 });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    return null;
  }

  try {
    const response = await fetch(`${base}${AUTH_ENDPOINTS.me}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.success ? result.data.user : null;
  } catch {
    return null;
  }
}
