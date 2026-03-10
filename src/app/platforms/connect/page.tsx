"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type OnboardingSessionPayload = {
  id: string;
  status: string;
  error: string | null;
  grantedPermissions: string[];
  deniedPermissions: string[];
  missingPermissions: string[];
  metadata?: {
    pages?: Array<{
      id: string;
      name: string;
      instagram_business_account?: {
        id: string;
        username?: string;
      };
    }>;
  } | null;
};

export default function PlatformConnectPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<OnboardingSessionPayload | null>(null);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingSession = params.get("session");
    const incomingStatus = params.get("status");
    const incomingError = params.get("error");

    if (incomingSession) {
      setSessionId(incomingSession);
    }
    if (incomingStatus) {
      setStatus(incomingStatus);
    }
    if (incomingError) {
      setError(incomingError);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetch(`/api/platforms/onboarding/session/${sessionId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load onboarding session");
        }
        return response.json();
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setSession(payload.data as OnboardingSessionPayload);
        const pages = payload.data?.metadata?.pages ?? [];
        if (pages.length > 0) {
          setSelectedPageId((prev) => prev || pages[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load onboarding session details.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const pages = useMemo(() => session?.metadata?.pages ?? [], [session]);
  const selectedPage = pages.find((page) => page.id === selectedPageId);

  async function startOAuth() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/platforms/onboarding/meta/start", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to start OAuth");
      }
      const payload = await response.json();
      window.location.href = payload.data.authUrl;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to start OAuth");
      setLoading(false);
    }
  }

  async function completeConnection() {
    if (!sessionId || !selectedPageId) {
      return;
    }
    setError(null);
    setCompleting(true);

    try {
      const response = await fetch("/api/platforms/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, selectedPageId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to complete onboarding");
      }
      setCompleted(true);
      setStatus("completed");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to complete onboarding");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="page-grid">
      <section className="glass-card rounded-2xl p-5">
        <h2 className="font-heading text-lg font-semibold text-white">Meta Connection Onboarding</h2>
        <p className="mt-1 text-sm text-slate-300">
          Guided OAuth setup for Facebook and Instagram. No manual env editing required.
        </p>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-heading text-base font-semibold text-white">Step 1: Authorize with Meta</h3>
        <p className="mt-2 text-sm text-slate-300">
          Click connect to open Meta OAuth and grant required permissions.
        </p>
        <button
          type="button"
          onClick={() => void startOAuth()}
          disabled={loading}
          className="mt-4 rounded-lg border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm text-blue-100 hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Connecting..." : "Connect Meta Account"}
        </button>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-heading text-base font-semibold text-white">
          Step 2: Validate permissions and select Page
        </h3>

        {status ? (
          <p className="mt-2 text-xs text-slate-400">
            OAuth status: <span className="text-slate-200">{status}</span>
          </p>
        ) : null}

        {session ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-200">Granted permissions:</p>
              <p className="mt-1 text-xs text-slate-300">
                {session.grantedPermissions.length > 0
                  ? session.grantedPermissions.join(", ")
                  : "None"}
              </p>
            </div>

            {session.missingPermissions.length > 0 ? (
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-200">Missing required permissions:</p>
                <p className="mt-1 text-xs text-amber-100">
                  {session.missingPermissions.join(", ")}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
                <p className="text-sm text-emerald-200">Required permissions validated.</p>
              </div>
            )}

            <label className="block text-sm text-slate-200">
              Facebook Page
              <select
                value={selectedPageId}
                onChange={(event) => setSelectedPageId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
              >
                {pages.length === 0 ? <option value="">No pages available</option> : null}
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name} ({page.id})
                  </option>
                ))}
              </select>
            </label>

            {selectedPage?.instagram_business_account?.id ? (
              <p className="text-xs text-slate-300">
                Linked Instagram:{" "}
                <span className="text-slate-100">
                  {selectedPage.instagram_business_account.username ||
                    selectedPage.instagram_business_account.id}
                </span>
              </p>
            ) : (
              <p className="text-xs text-amber-200">
                No linked Instagram business account found for selected page.
              </p>
            )}

            <button
              type="button"
              onClick={() => void completeConnection()}
              disabled={
                completing ||
                !selectedPageId ||
                session.missingPermissions.length > 0 ||
                completed
              }
              className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {completed ? "Connected" : completing ? "Saving..." : "Complete Connection"}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">
            Complete OAuth first to load selectable Pages and permission status.
          </p>
        )}

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-heading text-base font-semibold text-white">Next step</h3>
        <p className="mt-2 text-sm text-slate-300">
          After completion, your Facebook and Instagram platform connections are created automatically.
        </p>
        <Link
          href="/platforms"
          className="mt-4 inline-block rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-100 hover:bg-white/15"
        >
          Back to Platforms
        </Link>
      </section>
    </div>
  );
}
