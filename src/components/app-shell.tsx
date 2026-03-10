"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { NAV_ITEMS } from "@/lib/constants";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isLoginPage = pathname === "/login";

  const pageTitle = useMemo(() => {
    const match = NAV_ITEMS.find((item) => {
      if (item.href === "/") return pathname === "/";
      return pathname.startsWith(item.href);
    });

    return match?.label ?? "Aries AI";
  }, [pathname]);

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.15),_transparent_35%),var(--color-bg)] text-slate-100">
        <main className="mx-auto flex min-h-screen max-w-[720px] items-center px-6 py-8">{children}</main>
      </div>
    );
  }

  const userLabel = session?.user?.name || session?.user?.email || "Owner";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.15),_transparent_35%),var(--color-bg)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <button
          type="button"
          className="fixed right-4 top-4 z-50 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur lg:hidden"
          onClick={() => setOpen((state) => !state)}
        >
          Menu
        </button>

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-[rgba(10,15,30,0.85)] p-5 backdrop-blur transition-transform duration-200 lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-white">Aries AI</h1>
            <p className="mt-1 text-sm text-slate-300">Sugar and Leather</p>
          </div>
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg border px-4 py-2.5 text-sm transition ${
                    active
                      ? "border-blue-400/60 bg-blue-500/20 text-blue-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[rgba(10,15,30,0.65)] px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div>
              <p className="font-heading text-xl font-semibold tracking-tight text-white">{pageTitle}</p>
              <p className="text-sm text-slate-300">AI marketing automation for small businesses</p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-amber-400" />
              <span className="text-sm text-slate-100">{userLabel}</span>
              <button
                type="button"
                className="rounded-md border border-white/20 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </button>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="app-content">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
