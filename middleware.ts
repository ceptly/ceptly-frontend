import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const unprotectedPaths = [
  "/auth",
  "/onboarding",
  "/invite",
  "/subscribe",
  "/subscription-required",
];

const billingExemptPaths = ["/subscribe", "/subscription-required", "/settings/billing"];

function isBillingEnforced() {
  return process.env.NEXT_PUBLIC_BILLING_ENFORCED !== "false";
}

function matchesPath(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isUnprotected(pathname: string) {
  return matchesPath(pathname, unprotectedPaths);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const onboardingComplete =
    request.cookies.get("onboarding_complete")?.value === "1";
  const subscriptionActive =
    request.cookies.get("subscription_active")?.value === "1";
  const billingCanManage =
    request.cookies.get("billing_can_manage")?.value === "1";
  const isPublic = isUnprotected(pathname);

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (token && pathname.startsWith("/auth")) {
    const invite = request.nextUrl.searchParams.get("invite");
    if (invite) {
      return NextResponse.redirect(new URL(`/invite/${invite}`, request.url));
    }

    return NextResponse.redirect(
      new URL(onboardingComplete ? "/chat" : "/onboarding", request.url),
    );
  }

  if (token && !onboardingComplete && !isPublic) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (token && onboardingComplete && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (
    token &&
    onboardingComplete &&
    isBillingEnforced() &&
    !subscriptionActive &&
    !matchesPath(pathname, billingExemptPaths)
  ) {
    if (billingCanManage) {
      return NextResponse.redirect(new URL("/subscribe", request.url));
    }

    return NextResponse.redirect(
      new URL("/subscription-required", request.url),
    );
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
