import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusPill } from "@/components/status-pill";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalPosts, pendingApproval, scheduled, publishedThisWeek, activity] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.post.count({ where: { status: "SCHEDULED" } }),
      prisma.post.count({
        where: {
          status: "PUBLISHED",
          publishedAt: {
            // eslint-disable-next-line react-hooks/purity
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.postLog.findMany({
        include: { post: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  return (
    <div className="page-grid">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Posts" value={totalPosts} />
        <StatCard title="Pending Approval" value={pendingApproval} />
        <StatCard title="Scheduled" value={scheduled} />
        <StatCard title="Published This Week" value={publishedThisWeek} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/posts" className="text-sm text-blue-300 hover:text-blue-200">
              View all posts
            </Link>
          </div>
          <div className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-slate-300">No activity yet.</p>
            ) : (
              activity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white">{log.post.title ?? "Untitled Post"}</p>
                    <p className="text-xs text-slate-300">{log.details ?? "No details"}</p>
                  </div>
                  <div className="text-right">
                    <StatusPill status={log.action} />
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-heading text-lg font-semibold text-white">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <Link
              href="/posts/new"
              className="block rounded-lg border border-blue-400/40 bg-blue-500/20 px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-500/30"
            >
              Create Post
            </Link>
            <Link
              href="/posts?status=PENDING_APPROVAL"
              className="block rounded-lg border border-amber-400/40 bg-amber-500/20 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-500/30"
            >
              Review Queue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <article className="glass-card rounded-2xl p-5">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-2 font-heading text-3xl font-semibold text-white">{value}</p>
    </article>
  );
}
