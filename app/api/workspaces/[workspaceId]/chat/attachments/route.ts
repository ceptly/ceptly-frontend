import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { resolveApiBaseUrl } from "@/lib/api/auth";

interface RouteContext {
  params: Promise<{ workspaceId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    return NextResponse.json(
      { success: false, error: "Expected a file upload" },
      { status: 400 },
    );
  }

  // Forward the raw multipart body verbatim so the boundary stays intact.
  const body = await request.arrayBuffer();
  const base = await resolveApiBaseUrl();
  const upstream = await fetch(
    `${base}/api/workspaces/${workspaceId}/chat/attachments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType,
      },
      body,
    },
  );

  const text = await upstream.text();
  const responseContentType =
    upstream.headers.get("content-type") ?? "application/json";
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": responseContentType },
  });
}
