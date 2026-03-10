import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  return NextResponse.json({ data: posts });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const post = await prisma.post.create({
    data: {
      title: body.title ?? null,
      content: body.content ?? "",
      localMediaPaths: Array.isArray(body.mediaUrls) ? body.mediaUrls : [],
      cdnMediaUrls: Array.isArray(body.cdnMediaUrls) ? body.cdnMediaUrls : [],
      mediaType: body.mediaType ?? "TEXT",
      mediaStage: Array.isArray(body.cdnMediaUrls) && body.cdnMediaUrls.length > 0 ? "CDN" : "LOCAL",
      status: body.status ?? "DRAFT",
      platforms: Array.isArray(body.platforms) ? body.platforms : [],
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      aiGenerated: body.aiGenerated ?? true,
      aiPrompt: body.aiPrompt ?? null,
      logs: {
        create: {
          action: "CREATED",
          details: "Post created via API",
        },
      },
    },
  });

  return NextResponse.json({ data: post }, { status: 201 });
}
