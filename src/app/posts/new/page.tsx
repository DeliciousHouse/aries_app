"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_OPTIONS } from "@/lib/constants";

type GenerateResponse = {
  data: {
    caption: string;
    imageUrl: string;
    suggestedMediaType: "IMAGE" | "VIDEO" | "CAROUSEL" | "REEL" | "STORY" | "TEXT";
  };
};

export default function NewPostPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<GenerateResponse["data"]["suggestedMediaType"]>("IMAGE");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["FACEBOOK", "INSTAGRAM"]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewPlatform = useMemo(() => selectedPlatforms[0] || "INSTAGRAM", [selectedPlatforms]);

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((value) => value !== platform) : [...prev, platform],
    );
  }

  async function onGenerate() {
    setError(null);
    setAiLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          platforms: selectedPlatforms,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation request failed");
      }

      const payload = (await response.json()) as GenerateResponse;
      setCaption(payload.data.caption || "");
      setMediaUrl(payload.data.imageUrl || "");
      setMediaType(payload.data.suggestedMediaType || "IMAGE");
      setAiGenerated(true);
    } catch {
      setError("Unable to generate content right now. Try again.");
    } finally {
      setAiLoading(false);
    }
  }

  async function onSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prompt ? prompt.slice(0, 80) : "Generated Post",
          content: caption,
          mediaUrls: mediaUrl ? [mediaUrl] : [],
          mediaType,
          platforms: selectedPlatforms,
          scheduledAt: scheduleEnabled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          status: "PENDING_APPROVAL",
          aiGenerated,
          aiPrompt: aiGenerated ? prompt : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Post creation failed");
      }

      const payload = await response.json();
      router.push(`/posts/${payload.data.id}`);
      router.refresh();
    } catch {
      setError("Unable to submit post to queue. Please check required fields.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-grid lg:grid-cols-3">
      <section className="glass-card rounded-2xl p-5 lg:col-span-2">
        <h2 className="font-heading text-lg font-semibold text-white">Create Post</h2>
        <p className="mt-1 text-sm text-slate-300">Switch between AI generation and manual creation.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-heading text-base font-semibold text-white">AI Generation Mode</h3>
            <label className="mt-3 block text-sm text-slate-200">
              Prompt
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Promote this weekend tasting event with a warm, premium tone..."
                className="mt-2 h-32 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
              />
            </label>
            <button
              type="button"
              disabled={aiLoading || !prompt.trim()}
              onClick={onGenerate}
              className="mt-3 rounded-lg border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm text-blue-100 hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiLoading ? "Generating..." : "Generate Content"}
            </button>
          </article>

          <article className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-heading text-base font-semibold text-white">Manual Mode</h3>
            <label className="mt-3 block text-sm text-slate-200">
              Upload Image/Video URL
              <input
                value={mediaUrl}
                onChange={(event) => setMediaUrl(event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-200">
              Caption
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Write your caption..."
                className="mt-2 h-32 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
              />
            </label>
          </article>
        </div>

        <article className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-heading text-base font-semibold text-white">Platform Selector</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {PLATFORM_OPTIONS.map((platform) => (
              <label
                key={platform}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform)}
                  onChange={() => togglePlatform(platform)}
                  className="accent-blue-500"
                />
                {platform}
              </label>
            ))}
          </div>
        </article>

        <article className="mt-4 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(event) => setScheduleEnabled(event.target.checked)}
              className="accent-blue-500"
            />
            Schedule for later
          </label>
          <label className="text-sm text-slate-200">
            Schedule Date/Time
            <input
              type="datetime-local"
              disabled={!scheduleEnabled}
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
        </article>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-amber-400/40 bg-amber-500/20 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/30"
          >
            Preview
          </button>
          <button
            type="button"
            disabled={submitting || selectedPlatforms.length === 0 || !caption.trim()}
            onClick={onSubmit}
            className="rounded-lg border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm text-blue-100 hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit to Queue"}
          </button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-heading text-base font-semibold text-white">Preview</h3>
        <div className="mt-4 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-slate-900 to-amber-500/20 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">{previewPlatform} Preview</p>
          {mediaUrl ? (
            <img
              src={mediaUrl}
              alt="Generated preview"
              className="mt-3 h-56 w-full rounded-lg object-cover"
            />
          ) : (
            <p className="mt-3 text-sm text-slate-300">No media selected yet.</p>
          )}
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-100">
            {caption || "Your generated or manual caption will appear here."}
          </p>
        </div>
      </section>
    </div>
  );
}
