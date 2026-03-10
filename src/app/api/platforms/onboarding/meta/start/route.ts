import { NextResponse, type NextRequest } from "next/server";
import { startMetaOnboarding } from "@/lib/meta-oauth";

export async function POST(request: NextRequest) {
  try {
    const result = await startMetaOnboarding(request);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start Meta onboarding",
      },
      { status: 400 },
    );
  }
}
