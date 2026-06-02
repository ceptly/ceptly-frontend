import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth/server";

export async function GET(request: Request) {
  await clearAuthCookies();
  return NextResponse.redirect(new URL("/auth", request.url));
}
