import { NextResponse, type NextRequest } from "next/server";
import { handleMetaCallback } from "@/lib/meta-oauth";

export async function GET(request: NextRequest) {
  try {
    const result = await handleMetaCallback(request);
    const redirectUrl = new URL("/platforms/connect", request.nextUrl.origin);
    redirectUrl.searchParams.set("session", result.sessionId);
    redirectUrl.searchParams.set("status", result.success ? "connected" : "failed");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const redirectUrl = new URL("/platforms/connect", request.nextUrl.origin);
    redirectUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "OAuth callback failed",
    );
    return NextResponse.redirect(redirectUrl);
  }
}
