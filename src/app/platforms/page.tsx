import { StatusPill } from "@/components/status-pill";
import { PLATFORM_META } from "@/lib/constants";
import { syncPlatformConnectionsFromEnv } from "@/lib/platform-connections";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlatformsPage() {
  await syncPlatformConnectionsFromEnv();

  const connections = await prisma.platformConnection.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-grid">
      <section className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">Platform Connections</h2>
            <p className="mt-1 text-sm text-slate-300">Manage connected accounts and token health.</p>
          </div>
          <Link
            href="/platforms/connect"
            className="rounded-lg border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm text-blue-100 hover:bg-blue-500/30"
          >
            Connect with Meta OAuth
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {connections.length === 0 ? (
          <p className="text-sm text-slate-300">No platform accounts connected yet.</p>
        ) : (
          connections.map((connection) => {
            const meta = PLATFORM_META[connection.platform];
            const label = meta?.label ?? connection.platform;
            const platformColor = meta?.color ?? "bg-slate-600/20 border-slate-500/40 text-slate-200";

            const expiringSoon =
              connection.tokenExpiresAt &&
              connection.tokenExpiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

            const metadata = connection.metadata as Record<string, unknown> | null;

            return (
              <article key={connection.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${platformColor}`}>
                      {label}
                    </span>
                  </div>
                  <StatusPill status={connection.status} />
                </div>
                <p className="mt-2 text-sm text-slate-200">{connection.accountName}</p>
                <p className="mt-1 text-xs text-slate-400">Account ID: {connection.accountId}</p>

                {metadata && Object.keys(metadata).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(metadata).map(([key, val]) => (
                      <span key={key} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {key}: {String(val)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  {connection.tokenExpiresAt
                    ? `Token Expires: ${connection.tokenExpiresAt.toLocaleString()}`
                    : "Token expiry not set"}
                </div>

                {expiringSoon && (
                  <p className="mt-2 text-xs text-amber-300">Warning: Token expires in less than 7 days.</p>
                )}

                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg border border-blue-400/40 bg-blue-500/20 px-3 py-2 text-xs text-blue-100 hover:bg-blue-500/30">
                    Refresh Token
                  </button>
                  <button className="rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-2 text-xs text-red-100 hover:bg-red-500/30">
                    Disconnect
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
