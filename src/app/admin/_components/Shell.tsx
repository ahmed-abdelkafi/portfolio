"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../_lib/api";
import { RangeProvider } from "../_lib/range";
import DateFilter from "./DateFilter";

export const NAV = [
  { href: "/admin", label: "Overview", sub: "The whole picture" },
  { href: "/admin/realtime", label: "Real-time", sub: "Who is here now", noRange: true },
  { href: "/admin/visitors", label: "Visitors", sub: "New and returning" },
  { href: "/admin/sources", label: "Traffic sources", sub: "Where they come from" },
  { href: "/admin/geography", label: "Geography", sub: "Countries and regions" },
  { href: "/admin/devices", label: "Devices & browsers", sub: "How they browse" },
  { href: "/admin/pages", label: "Pages & projects", sub: "What they read" },
  { href: "/admin/behavior", label: "Visitor behavior", sub: "What they click" },
  { href: "/admin/seo", label: "SEO performance", sub: "Google Search and site health", noRange: true },
  { href: "/admin/settings", label: "Settings", sub: "Account and data", noRange: true },
] as const;

const norm = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = norm(usePathname() ?? "/admin");
  const active = NAV.find((n) => n.href === pathname) ?? NAV[0];
  const index = NAV.indexOf(active);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    api<{ username: string }>("/api/admin/me")
      .then((r) => setUser(r.username))
      .catch(() => {});
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile menu after navigation
  useEffect(() => setOpen(false), [pathname]);

  const signOut = async () => {
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload clears client state after sign-out
    window.location.assign("/admin/login");
  };

  return (
    <RangeProvider>
      <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-[var(--ink)] text-[var(--bone)] transition-transform duration-500 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
          style={{ transitionTimingFunction: "var(--ease)" }}
        >
          <div className="flex items-center gap-3 px-6 pb-6 pt-7">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--red)] text-[13px] font-extrabold [font-stretch:62%]">A.A.</span>
            <div>
              <p className="display text-[22px]">Control room</p>
              <p className="label !text-[var(--muted-dark)]">ahmed-abdelkafi.dev</p>
            </div>
          </div>
          <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3">
            <ul className="space-y-0.5">
              {NAV.map((n, i) => (
                <li key={n.href}>
                  <Link href={n.href} className="nav-link" aria-current={n.href === active.href ? "page" : undefined}>
                    <span className="nav-no">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[14.5px] font-medium">{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-[var(--ink-2)] px-6 py-5">
            <p className="label !text-[var(--muted-dark)]">Signed in as</p>
            <p className="mt-1 truncate text-sm">{user ?? "…"}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <a href="/en" target="_blank" rel="noreferrer" className="label !text-[var(--muted-dark)] hover:!text-[var(--bone)]">
                View site ↗
              </a>
              <button type="button" onClick={signOut} className="label !text-[var(--bone)] hover:!text-[var(--red)]">
                Sign out
              </button>
            </div>
          </div>
        </aside>
        {open && <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

        <div className="min-w-0">
          <header className="z-20 lg:sticky lg:top-0 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bone)_88%,transparent)] backdrop-blur-md">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-5 py-5 md:px-10">
              <div className="flex items-end gap-4">
                <button type="button" className="chip lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                  Menu
                </button>
                <div>
                  <p className="label">
                    <span className="text-[var(--red)]">{String(index + 1).padStart(2, "0")}</span> / {String(NAV.length).padStart(2, "0")} · {active.sub}
                  </p>
                  <h1 className="display mt-2 text-[clamp(34px,4.4vw,60px)]">{active.label}</h1>
                </div>
              </div>
              {!("noRange" in active) && <DateFilter />}
            </div>
          </header>
          <main key={active.href} className="fade-up px-5 py-8 md:px-10 md:py-10">
            {children}
          </main>
        </div>
      </div>
    </RangeProvider>
  );
}
