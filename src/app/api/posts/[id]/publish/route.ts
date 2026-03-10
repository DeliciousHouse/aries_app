import { NextRequest, NextResponse } from "next/server";
import { Platform, type Prisma } from "@prisma/client";
import { publishToFacebook, publishToInstagram } from "@/lib/publishers/meta";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const requestedPlatforms = post.platforms as Platform[];
  if (requestedPlatforms.length === 0) {
    return NextResponse.json({ error: "Post has no target platforms" }, { status: 400 });
  }

  const mediaPublicBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL?.trim();
  let cdnMediaUrls = post.cdnMediaUrls ?? [];

  if (cdnMediaUrls.length === 0 && post.localMediaPaths.length > 0) {
    await prisma.post.update({
      where: { id },
      data: { mediaStage: "UPLOADING" },
    });

    const mappedUrls = post.localMediaPaths
      .map((path) => {
        if (/^https?:\/\//i.test(path)) {
          return path;
        }
        if (!mediaPublicBaseUrl) {
          return null;
        }
        const filename = path.split("/").pop();
        if (!filename) {
          return null;
        }
        return `${mediaPublicBaseUrl.replace(/\/$/, "")}/${filename}`;
      })
      .filter((value): value is string => Boolean(value));

    if (mappedUrls.length > 0) {
      cdnMediaUrls = mappedUrls;
      await prisma.post.update({
        where: { id },
        data: {
          cdnMediaUrls: mappedUrls,
          mediaStage: "CDN",
        },
      });
    }
  }

  const publishingPost = await prisma.post.update({
    where: { id },
    data: {
      status: "PUBLISHING",
      logs: {
        create: {
          action: "SCHEDULED",
          details: "Publish triggered",
        },
      },
    },
  });

  const connections = await prisma.platformConnection.findMany({
    where: { platform: { in: requestedPlatforms } },
  });
  const connectionByPlatform = new Map(connections.map((connection) => [connection.platform, connection]));
  const primaryMediaUrl = cdnMediaUrls[0] || post.localMediaPaths[0] || null;

  const platformResults: Record<string, Prisma.JsonValue> = {};
  const failures: string[] = [];

  for (const platform of requestedPlatforms) {
    const connection = connectionByPlatform.get(platform);
    if (!connection) {
      const reason = `No ${platform} connection found`;
      platformResults[platform] = { success: false, reason };
      failures.push(reason);
      continue;
    }

    if (platform === Platform.FACEBOOK) {
      const result = await publishToFacebook(publishingPost, connection, primaryMediaUrl);
      platformResults[platform] = result;
      if (!result.success) {
        failures.push(`Facebook: ${result.error}`);
      }
      continue;
    }

    if (platform === Platform.INSTAGRAM) {
      const result = await publishToInstagram(publishingPost, connection, primaryMediaUrl);
      platformResults[platform] = result;
      if (!result.success) {
        failures.push(`Instagram: ${result.error}`);
      }
      continue;
    }

    const reason = `${platform} publish is not implemented yet`;
    platformResults[platform] = { success: false, reason };
    failures.push(reason);
  }

  const hasFailures = failures.length > 0;
  const finalStatus = hasFailures ? "FAILED" : "PUBLISHED";
  const now = new Date();
  const details = hasFailures
    ? `Publish failed: ${failures.join("; ")}`
    : "Post published successfully";

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      status: finalStatus,
      publishedAt: hasFailures ? null : now,
      platformResults,
      logs: {
        create: {
          action: hasFailures ? "FAILED" : "PUBLISHED",
          details,
        },
      },
    },
  });

  return NextResponse.json({
    data: updatedPost,
    failures,
    message: hasFailures ? "Publish completed with failures." : "Publish completed successfully.",
  });
}
