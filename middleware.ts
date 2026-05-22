import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicPaths = ["/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const onboardingComplete =
    request.cookies.get("onboarding_complete")?.value === "1";
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isOnboarding = pathname.startsWith("/onboarding");

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  if (!token && !isPublic && !isOnboarding) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (token && pathname === "/auth") {
    return NextResponse.redirect(
      new URL(onboardingComplete ? "/" : "/onboarding", request.url),
    );
  }

  if (token && !onboardingComplete && !isOnboarding && !isPublic) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (token && onboardingComplete && isOnboarding) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
