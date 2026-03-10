import { NextRequest, NextResponse } from "next/server";
import { syncPlatformConnectionsFromEnv } from "@/lib/platform-connections";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await syncPlatformConnectionsFromEnv();

  const platforms = await prisma.platformConnection.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: platforms });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const connection = await prisma.platformConnection.create({
    data: {
      platform: body.platform,
      accountName: body.accountName,
      accountId: body.accountId,
      accessToken: body.accessToken ?? "encrypted-token-placeholder",
      tokenExpiresAt: body.tokenExpiresAt ? new Date(body.tokenExpiresAt) : null,
      metadata: body.metadata ?? null,
      status: body.status ?? "ACTIVE",
    },
  });

  return NextResponse.json({ data: connection }, { status: 201 });
}
