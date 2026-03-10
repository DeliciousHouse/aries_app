export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/posts", label: "Posts" },
  { href: "/platforms", label: "Platforms" },
  { href: "/settings", label: "Settings" },
] as const;

export const PLATFORM_OPTIONS = [
  "FACEBOOK",
  "INSTAGRAM",
  "REDDIT",
  "YOUTUBE",
  "LINKEDIN",
  "X",
  "TIKTOK",
] as const;

export const PLATFORM_META: Record<string, { label: string; color: string }> = {
  FACEBOOK: { label: "Facebook", color: "bg-blue-600/20 border-blue-500/40 text-blue-200" },
  INSTAGRAM: { label: "Instagram", color: "bg-pink-600/20 border-pink-500/40 text-pink-200" },
  REDDIT: { label: "Reddit", color: "bg-orange-600/20 border-orange-500/40 text-orange-200" },
  YOUTUBE: { label: "YouTube", color: "bg-red-600/20 border-red-500/40 text-red-200" },
  LINKEDIN: { label: "LinkedIn", color: "bg-sky-600/20 border-sky-500/40 text-sky-200" },
  X: { label: "X (Twitter)", color: "bg-slate-600/20 border-slate-500/40 text-slate-200" },
  TIKTOK: { label: "TikTok", color: "bg-fuchsia-600/20 border-fuchsia-500/40 text-fuchsia-200" },
};

export const POST_STATUS_OPTIONS = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
  "REJECTED",
] as const;

export function formatStatusLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
