import { NextResponse, type NextRequest } from "next/server";
import { completeMetaOnboarding } from "@/lib/meta-oauth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const sessionId = String(body.sessionId ?? "");
  const selectedPageId = String(body.selectedPageId ?? "");

  if (!sessionId || !selectedPageId) {
    return NextResponse.json(
      { error: "sessionId and selectedPageId are required" },
      { status: 400 },
    );
  }

  try {
    const result = await completeMetaOnboarding(sessionId, selectedPageId);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete onboarding" },
      { status: 400 },
    );
  }
}
