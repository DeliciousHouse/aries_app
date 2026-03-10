import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const post = await prisma.post.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
      rejectionReason: body.reason ?? "Rejected in review queue",
      logs: {
        create: {
          action: "REJECTED",
          details: body.reason ?? "Post rejected",
        },
      },
    },
  });

  return NextResponse.json({ data: post });
}
