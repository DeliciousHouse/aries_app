"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "/";
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("callbackUrl") || "/";
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result?.ok) {
        setError("Invalid credentials. Check ADMIN_EMAIL and ADMIN_PASSWORD.");
        return;
      }

      router.push(result.url || callbackUrl);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur">
      <h1 className="font-heading text-2xl font-semibold text-white">Sign in to Aries AI</h1>
      <p className="mt-2 text-sm text-slate-300">
        Use your owner credentials configured in environment variables.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm text-slate-200">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <label className="block text-sm text-slate-200">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60"
          />
        </label>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm text-blue-100 hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
