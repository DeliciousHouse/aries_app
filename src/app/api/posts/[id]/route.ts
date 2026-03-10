import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { logs: { orderBy: { createdAt: "desc" } } },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ data: post });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const updated = await prisma.post.update({
    where: { id },
    data: {
      title: body.title,
      content: body.content,
      localMediaPaths: body.localMediaPaths ?? body.mediaUrls,
      mediaType: body.mediaType,
      platforms: body.platforms,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      status: body.status,
      aiPrompt: body.aiPrompt,
      logs: {
        create: {
          action: "EDITED",
          details: "Post updated via API",
        },
      },
    },
    include: { logs: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
