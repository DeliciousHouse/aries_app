import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const post = await prisma.post.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
      logs: {
        create: {
          action: "APPROVED",
          details: "Post approved",
        },
      },
    },
  });

  return NextResponse.json({ data: post });
}
