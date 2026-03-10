import { notFound } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { PostActions } from "@/components/post-actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PostDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="page-grid lg:grid-cols-3">
      <section className="glass-card rounded-2xl p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-white">Post Preview</h2>
          <StatusPill status={post.status} />
        </div>
        <div className="mb-4 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-slate-900 to-amber-500/20 p-6">
          <p className="mb-4 text-sm text-slate-300">Media Type: {post.mediaType}</p>
          <div className="space-y-2">
            {((post as any).cdnMediaUrls?.length ? (post as any).cdnMediaUrls : (post as any).localMediaPaths).length === 0 ? (
              <p className="text-sm text-slate-300">No media attached.</p>
            ) : (
              ((post as any).cdnMediaUrls?.length ? (post as any).cdnMediaUrls : (post as any).localMediaPaths).map((url: string) => (
                <p key={url} className="truncate text-sm text-slate-200">
                  {url}
                </p>
              ))
            )}
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{post.content}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {post.platforms.map((platform) => (
            <span
              key={platform}
              className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-slate-200"
            >
              {platform}
            </span>
          ))}
        </div>

        <PostActions
          postId={post.id}
          initialStatus={post.status}
          initialScheduledAt={toLocalDateTime(post.scheduledAt)}
        />
      </section>

      <section className="space-y-4">
        <article className="glass-card rounded-2xl p-5">
          <h3 className="font-heading text-base font-semibold text-white">Platform Previews</h3>
          <div className="mt-4 space-y-3">
            {post.platforms.map((platform) => (
              <div key={platform} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">{platform}</p>
                <p className="mt-2 text-sm text-slate-200">{post.content.slice(0, 140)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card rounded-2xl p-5">
          <h3 className="font-heading text-base font-semibold text-white">Activity Timeline</h3>
          <div className="mt-4 space-y-3">
            {post.logs.length === 0 ? (
              <p className="text-sm text-slate-300">No timeline entries yet.</p>
            ) : (
              post.logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-white">{log.action}</p>
                  <p className="text-xs text-slate-300">{log.details ?? "No details"}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function toLocalDateTime(value: Date | null): string {
  if (!value) return "";
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}
