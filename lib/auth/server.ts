import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

import { AUTH_ENDPOINTS, resolveApiBaseUrl } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/types";
import { fetchOnboardingStatus } from "@/lib/api/onboarding";

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

export async function setOnboardingCompleteCookie(completed: boolean) {
  const cookieStore = await cookies();
  const options = cookieOptions();

  cookieStore.set("onboarding_complete", completed ? "1" : "0", {
    ...options,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearOnboardingCompleteCookie() {
  const cookieStore = await cookies();
  const options = cookieOptions();

  cookieStore.set("onboarding_complete", "", { ...options, maxAge: 0 });
}

export async function setWorkspaceNameCookie(name: string) {
  const cookieStore = await cookies();
  const options = cookieOptions();

  cookieStore.set("workspace_name", name, {
    ...options,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  const options = cookieOptions();

  cookieStore.set("access_token", "", { ...options, maxAge: 0 });
  cookieStore.set("refresh_token", "", { ...options, maxAge: 0 });
  cookieStore.set("onboarding_complete", "", { ...options, maxAge: 0 });
  cookieStore.set("workspace_name", "", { ...options, maxAge: 0 });
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  try {
    const base = await resolveApiBaseUrl();
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
    const user = result.success ? (result.data.user as AuthUser) : null;

    if (!user) {
      return null;
    }

    if (user.workspaces?.length) {
      return user;
    }

    const cookieStore = await cookies();
    const workspaceName = cookieStore.get("workspace_name")?.value;
    if (workspaceName) {
      return {
        ...user,
        workspaces: [{ id: "", name: workspaceName, role: "founder" }],
      };
    }

    const onboarding = await fetchOnboardingStatus(token);
    if (onboarding?.organizationName) {
      return {
        ...user,
        workspaces: [
          {
            id: onboarding.workspaceId ?? "",
            name: onboarding.organizationName,
            role: "founder",
          },
        ],
      };
    }

    return user;
  } catch {
    return null;
  }
});

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    if (await getAccessToken()) {
      await clearAuthCookies();
    }
    redirect("/auth");
  }

  return user;
}
