import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const connection = await prisma.platformConnection.findUnique({ where: { id } });

  if (!connection) {
    return NextResponse.json({ error: "Platform connection not found" }, { status: 404 });
  }

  return NextResponse.json({ data: connection });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const updated = await prisma.platformConnection.update({
    where: { id },
    data: {
      accountName: body.accountName,
      accountId: body.accountId,
      accessToken: body.accessToken,
      tokenExpiresAt: body.tokenExpiresAt ? new Date(body.tokenExpiresAt) : undefined,
      metadata: body.metadata,
      status: body.status,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await prisma.platformConnection.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
