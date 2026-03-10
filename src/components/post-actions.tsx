"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PostActionsProps = {
  postId: string;
  initialStatus: string;
  initialScheduledAt: string;
};

export function PostActions({ postId, initialStatus, initialScheduledAt }: PostActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPublishNow = useMemo(
    () => status === "APPROVED" || status === "SCHEDULED" || status === "FAILED",
    [status],
  );

  async function callAction(
    action: "approve" | "reject" | "publish",
    payload?: Record<string, unknown>,
  ) {
    setError(null);
    setBusyAction(action);
    const optimisticStatus = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "PUBLISHING";
    const previous = status;
    setStatus(optimisticStatus);

    try {
      const route =
        action === "publish" ? `/api/posts/${postId}/publish` : `/api/posts/${postId}/${action}`;
      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        throw new Error(`${action} failed`);
      }

      const data = await response.json();
      setStatus(data.data?.status || optimisticStatus);
      router.refresh();
    } catch {
      setStatus(previous);
      setError("Action failed. Please try again.");
    } finally {
      setBusyAction(null);
    }
  }

  async function saveSchedule() {
    setError(null);
    setBusyAction("schedule");
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          status: scheduledAt ? "SCHEDULED" : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("schedule failed");
      }

      const data = await response.json();
      setStatus(data.data?.status || status);
      router.refresh();
    } catch {
      setError("Unable to save schedule.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      <label className="block text-sm text-slate-200">
        Schedule Date/Time
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
        />
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <button
          type="button"
          onClick={() => void saveSchedule()}
          disabled={busyAction !== null}
          className="rounded-lg border border-indigo-400/40 bg-indigo-500/20 px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save Schedule
        </button>
        <button
          type="button"
          onClick={() => void callAction("approve")}
          disabled={busyAction !== null}
          className="rounded-lg border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm text-blue-100 hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "approve" ? "Approving..." : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => {
            const reason = window.prompt("Rejection reason", "Rejected in review queue");
            void callAction("reject", { reason: reason || "Rejected in review queue" });
          }}
          disabled={busyAction !== null}
          className="rounded-lg border border-red-400/40 bg-red-500/20 px-4 py-2 text-sm text-red-100 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "reject" ? "Rejecting..." : "Reject"}
        </button>
        {canPublishNow ? (
          <button
            type="button"
            onClick={() => void callAction("publish")}
            disabled={busyAction !== null}
            className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "publish" ? "Publishing..." : "Publish Now"}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-300 md:col-span-2">{error}</p> : null}
    </div>
  );
}
