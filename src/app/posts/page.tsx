import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { POST_STATUS_OPTIONS, PLATFORM_OPTIONS, formatStatusLabel } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PostsPageProps = {
  searchParams: Promise<{ status?: string; platform?: string }>;
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const statusFilter = params.status?.toUpperCase();
  const platformFilter = params.platform?.toUpperCase();
  const validStatus = POST_STATUS_OPTIONS.includes(statusFilter as (typeof POST_STATUS_OPTIONS)[number])
    ? (statusFilter as (typeof POST_STATUS_OPTIONS)[number])
    : undefined;
  const validPlatform = PLATFORM_OPTIONS.includes(platformFilter as (typeof PLATFORM_OPTIONS)[number])
    ? (platformFilter as (typeof PLATFORM_OPTIONS)[number])
    : undefined;

  const posts = await prisma.post.findMany({
    where: {
      ...(validStatus ? { status: validStatus } : {}),
      ...(validPlatform ? { platforms: { has: validPlatform } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-grid">
      <section className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">Posts Queue</h2>
            <p className="text-sm text-slate-300">Filter by status and review scheduled content.</p>
          </div>
          <Link
            href="/posts/new"
            className="rounded-lg border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm text-blue-100 hover:bg-blue-500/30"
          >
            New Post
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip href={buildPostsHref({ platform: validPlatform })} label="All Statuses" isActive={!validStatus} />
          {POST_STATUS_OPTIONS.map((status) => (
            <FilterChip
              key={status}
              href={buildPostsHref({ status, platform: validPlatform })}
              label={formatStatusLabel(status)}
              isActive={validStatus === status}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip href={buildPostsHref({ status: validStatus })} label="All Platforms" isActive={!validPlatform} />
          {PLATFORM_OPTIONS.map((platform) => (
            <FilterChip
              key={platform}
              href={buildPostsHref({ status: validStatus, platform })}
              label={platform}
              isActive={validPlatform === platform}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {posts.length === 0 ? (
          <p className="text-sm text-slate-300">No posts match this filter.</p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="glass-card rounded-2xl p-4 transition hover:border-blue-400/40"
            >
              <div className="mb-3 h-40 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-slate-900 to-amber-500/20 p-3 text-xs text-slate-300">
                {((post as any).cdnMediaUrls?.length ? (post as any).cdnMediaUrls : (post as any).localMediaPaths)[0] ? (
                  <p className="line-clamp-1">Media: {((post as any).cdnMediaUrls?.length ? (post as any).cdnMediaUrls : (post as any).localMediaPaths)[0]}</p>
                ) : (
                  <p>No media uploaded</p>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-white">{post.content}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {post.platforms.length === 0
                  ? PLATFORM_OPTIONS.slice(0, 1).map((platform) => (
                      <span
                        key={platform}
                        className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-slate-200"
                      >
                        {platform}
                      </span>
                    ))
                  : post.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-slate-200"
                      >
                        {platform}
                      </span>
                    ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <StatusPill status={post.status} />
                <p className="text-xs text-slate-400">
                  {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "Not scheduled"}
                </p>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}

function FilterChip({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        isActive
          ? "border-blue-400/50 bg-blue-500/20 text-blue-100"
          : "border-white/15 bg-white/5 text-slate-300 hover:border-white/30"
      }`}
    >
      {label}
    </Link>
  );
}

function buildPostsHref({
  status,
  platform,
}: {
  status?: string;
  platform?: string;
}) {
  const params = new URLSearchParams();
  if (status) {
    params.set("status", status);
  }
  if (platform) {
    params.set("platform", platform);
  }
  const query = params.toString();
  return query ? `/posts?${query}` : "/posts";
}
