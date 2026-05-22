"use server";

import { redirect } from "next/navigation";

import { AUTH_ENDPOINTS, getApiBaseUrl } from "@/lib/api/auth";
import type { AuthSessionResponse } from "@/lib/api/types";
import {
  SignInFormSchema,
  SignUpFormSchema,
  type FormState,
} from "@/lib/auth-schemas";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/server";

async function authenticate(
  endpoint: string,
  body: Record<string, string>,
): Promise<FormState> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return {
        errors: {
          _form: ["Server error. Please try again later."],
        },
      };
    }

    const result = (await response.json()) as AuthSessionResponse;

    if (!response.ok || !result.success || !result.data) {
      return {
        errors: {
          _form: [result.error ?? "Authentication failed. Please try again."],
        },
      };
    }

    await setAuthCookies(result.data.session);
  } catch {
    return {
      errors: {
        _form: ["An unexpected error occurred. Please try again."],
      },
    };
  }

  redirect("/");
}

export async function signIn(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = SignInFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  return authenticate(AUTH_ENDPOINTS.login, { email, password });
}

export async function signUp(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = SignUpFormSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { fullName, email, password } = validatedFields.data;
  return authenticate(AUTH_ENDPOINTS.register, { fullName, email, password });
}

export async function signOut() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (base) {
      await fetch(`${base}${AUTH_ENDPOINTS.logout}`, {
        method: "POST",
      });
    }
  } catch {
    // Clearing local session is enough for logout.
  }

  await clearAuthCookies();
  redirect("/auth");
}
