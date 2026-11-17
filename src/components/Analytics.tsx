"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Cookie-free, first-party analytics. Sends small JSON beacons to /api/collect:
 *  - pageview on every route change, engagement time when the page is left or hidden,
 *  - a heartbeat while the tab is visible (for the real-time view, max 30 min per page),
 *  - named interactions (project, contact, email, LinkedIn, GitHub, CV, navigation clicks).
 * No cookie, no identifier in storage. One non-identifying flag ("aa-seen") tells the server
 * whether this browser has visited before, and "aa-optout" turns tracking off on this device.
 */

export const OPT_OUT_KEY = "aa-optout";
const SEEN_KEY = "aa-seen";
const PING_MS = 60_000;
const MAX_PING_MS = 30 * 60_000;

const read = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* storage blocked: tracking still works without the returning flag */
  }
};

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ (Math.random() * 16) >> (+c / 4)).toString(16));

const disabled = () => {
  if (typeof window === "undefined") return true;
  if (read(OPT_OUT_KEY) === "1") return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
};

function send(payload: Record<string, unknown>) {
  if (disabled()) return;
  const body = JSON.stringify({ id: uuid(), ...payload });
  try {
    fetch("/api/collect", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
  } catch {
    navigator.sendBeacon?.("/api/collect", new Blob([body], { type: "application/json" }));
  }
}

const localeOf = (path: string) => (path.startsWith("/fr") ? "fr" : path.startsWith("/en") ? "en" : undefined);

/** Map a click to one of the allowed event names (and a non-personal target). */
function classify(el: Element): { name: string; target?: string } | null {
  const tracked = el.closest<HTMLElement>("[data-track]");
  if (tracked?.dataset.track) return { name: tracked.dataset.track, target: tracked.dataset.trackTarget };
  const a = el.closest<HTMLAnchorElement>("a[href]");
  if (!a) return null;
  const href = a.getAttribute("href") ?? "";
  if (href.startsWith("mailto:")) return { name: "email_click" };
  if (href.startsWith("tel:")) return { name: "phone_click" };
  if (href.toLowerCase().endsWith(".pdf")) return { name: "cv_download", target: href.split("/").pop()?.slice(0, 60) };
  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host === "wa.me" || host.endsWith("whatsapp.com")) return { name: "whatsapp_click" };
  if (host.endsWith("linkedin.com")) return { name: "linkedin_click" };
  if (host.endsWith("github.com")) return { name: "github_click" };
  if (url.origin !== window.location.origin) return { name: "live_site_click", target: host };
  const work = url.pathname.match(/^\/(?:en|fr)\/work\/([a-z0-9-]+)/);
  if (work) return { name: "project_click", target: work[1] };
  if (a.closest("nav")) return { name: "nav_click", target: (url.hash || url.pathname).slice(0, 60) };
  if (url.hash === "#contact") return { name: "contact_click" };
  return null;
}

export default function Analytics() {
  const pathname = usePathname();
  const pv = useRef<{ id: string; path: string; visibleSince: number | null; visibleMs: number; started: number } | null>(null);
  const first = useRef(true);
  // Decided once per page load, before the flag is written, so every pageview of this visit agrees.
  const returning = useRef<boolean | null>(null);

  // Pageview + engagement for each route.
  useEffect(() => {
    if (!pathname || disabled()) return;
    const flush = () => {
      const cur = pv.current;
      if (!cur) return;
      const ms = cur.visibleMs + (cur.visibleSince ? performance.now() - cur.visibleSince : 0);
      if (ms >= 1000) send({ type: "engagement", pv: cur.id, path: cur.path, dur: Math.round(ms), locale: localeOf(cur.path) });
      cur.visibleMs = 0;
      cur.visibleSince = document.visibilityState === "visible" ? performance.now() : null;
    };

    const id = uuid();
    const isFirst = first.current;
    first.current = false;
    let utm: Record<string, string> | undefined;
    if (isFirst) {
      const q = new URLSearchParams(window.location.search);
      const u = { source: q.get("utm_source"), medium: q.get("utm_medium"), campaign: q.get("utm_campaign") };
      if (u.source || u.medium || u.campaign) utm = Object.fromEntries(Object.entries(u).filter(([, v]) => v)) as Record<string, string>;
    }
    if (returning.current === null) returning.current = read(SEEN_KEY) === "1";
    pv.current = { id, path: pathname, visibleSince: document.visibilityState === "visible" ? performance.now() : null, visibleMs: 0, started: Date.now() };
    send({
      type: "pageview",
      pv: id,
      path: pathname,
      locale: localeOf(pathname),
      ref: isFirst ? document.referrer || undefined : undefined,
      utm,
      w: window.screen?.width || window.innerWidth,
      ret: returning.current,
    });
    write(SEEN_KEY, "1");
    const work = pathname.match(/^\/(?:en|fr)\/work\/([a-z0-9-]+)/);
    if (work) send({ type: "event", name: "case_study_view", target: work[1], pv: id, path: pathname });

    const onVisibility = () => {
      const cur = pv.current;
      if (!cur) return;
      if (document.visibilityState === "hidden") flush();
      else cur.visibleSince = performance.now();
    };
    const onHide = () => flush();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    const ping = window.setInterval(() => {
      const cur = pv.current;
      if (!cur || document.visibilityState !== "visible" || Date.now() - cur.started > MAX_PING_MS) return;
      send({ type: "ping", pv: cur.id, path: cur.path });
    }, PING_MS);

    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      window.clearInterval(ping);
    };
  }, [pathname]);

  // Interactions, through one delegated listener.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const hit = classify(e.target);
      if (!hit) return;
      send({ type: "event", name: hit.name, target: hit.target, pv: pv.current?.id, path: pv.current?.path ?? window.location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
