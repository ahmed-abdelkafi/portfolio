import type { Env } from "./env";
import { changePassword, currentAdmin, listSessions, login, logout, revokeOtherSessions } from "./lib/auth";
import { collect } from "./lib/collect";
import { searchConsole } from "./lib/gsc";
import { seoHealth } from "./lib/seo";
import { badRange, behavior, devices, geography, overview, pages, parseRange, realtime, sources, visitors } from "./lib/stats";
import { error, json, utcDay } from "./lib/util";

/**
 * Worker in front of the static export. It only runs for /api/*, /admin* and RSC segment files (see run_worker_first
 * in wrangler.jsonc); every other path is served directly from static assets.
 */

const RETENTION_DAYS = 395; // ~13 months of raw events
const ADMIN_HEADERS = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy": "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

const withHeaders = (res: Response, headers: Record<string, string>) => {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
  return out;
};

const redirect = (to: string, req: Request) =>
  withHeaders(Response.redirect(new URL(to, req.url).toString(), 302), { "cache-control": "no-store" });

/**
 * Next.js 16 requests RSC segment payloads as ".../__next.a.b.__PAGE__.txt" while the static export
 * writes them as ".../__next.a/b/__PAGE__.txt". Returns the on-disk URL, or null if not such a request.
 */
function rscSegment(url: URL): URL | null {
  const m = decodeURIComponent(url.pathname).match(/^(.*\/)__next\.([^/]+)\.txt$/);
  if (!m || !m[2].includes(".")) return null;
  const parts = m[2].split(".");
  const out = new URL(url);
  out.pathname = `${m[1]}__next.${parts[0]}/${parts.slice(1).join("/")}.txt`;
  return out;
}

async function serveAdminPage(req: Request, env: Env, url: URL) {
  const isLogin = url.pathname === "/admin/login" || url.pathname === "/admin/login/";
  const admin = await currentAdmin(req, env);
  if (isLogin) {
    if (admin) return redirect("/admin", req);
  } else if (!admin) {
    return redirect("/admin/login", req);
  }
  const segment = rscSegment(url);
  if (segment) return withHeaders(await env.ASSETS.fetch(new Request(segment, req)), ADMIN_HEADERS);
  const res = await env.ASSETS.fetch(req);
  return withHeaders(res, ADMIN_HEADERS);
}

async function handleApi(req: Request, env: Env, url: URL) {
  const { pathname } = url;
  const method = req.method;

  if (pathname === "/api/collect") return method === "POST" ? collect(req, env) : error(405, "Method not allowed");

  if (!pathname.startsWith("/api/admin/")) return error(404, "Not found");
  if (pathname === "/api/admin/login") return method === "POST" ? login(req, env) : error(405, "Method not allowed");
  if (pathname === "/api/admin/logout") return method === "POST" ? logout(req, env) : error(405, "Method not allowed");

  // Everything below requires a valid administrator session, checked on the server for each request.
  const admin = await currentAdmin(req, env);
  if (!admin) return error(401, "Unauthorized");

  if (method === "POST") {
    if (pathname === "/api/admin/password") return changePassword(req, env, admin);
    if (pathname === "/api/admin/sessions/revoke") return revokeOtherSessions(req, env, admin);
    return error(404, "Not found");
  }
  if (method !== "GET") return error(405, "Method not allowed");

  switch (pathname) {
    case "/api/admin/me":
      return json({ username: admin.username });
    case "/api/admin/sessions":
      return listSessions(req, env, admin);
    case "/api/admin/realtime":
      return realtime(env);
    case "/api/admin/seo/health":
      return seoHealth(env, url);
    case "/api/admin/seo/search-console":
      return searchConsole(env, url);
    case "/api/admin/settings": {
      const counts = await env.DB.prepare(
        "SELECT COUNT(*) AS events, MIN(ts) AS first, MAX(ts) AS last FROM events WHERE type != 'ping'",
      ).first<{ events: number; first: number | null; last: number | null }>();
      return json({
        username: admin.username,
        retentionDays: RETENTION_DAYS,
        hosts: env.SITE_HOSTS.split(",").map((h) => h.trim()),
        searchConsole: { configured: Boolean(env.GSC_SERVICE_ACCOUNT && env.GSC_PROPERTY), property: env.GSC_PROPERTY ?? null },
        storage: counts,
      });
    }
  }

  const range = parseRange(url);
  if (!range) return badRange();
  switch (pathname) {
    case "/api/admin/overview":
      return overview(env, range);
    case "/api/admin/visitors":
      return visitors(env, range);
    case "/api/admin/sources":
      return sources(env, range);
    case "/api/admin/geography":
      return geography(env, range);
    case "/api/admin/devices":
      return devices(env, range);
    case "/api/admin/pages":
      return pages(env, range);
    case "/api/admin/behavior":
      return behavior(env, range);
  }
  return error(404, "Not found");
}

const worker = {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(req, env, url);
      if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return await serveAdminPage(req, env, url);
      const segment = rscSegment(url);
      if (segment) return env.ASSETS.fetch(new Request(segment, req));
      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error("worker error", e instanceof Error ? e.message : e);
      return error(500, "Internal error");
    }
  },

  /** Daily housekeeping: data retention and removal of short-lived records. */
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    const now = Date.now();
    const day = 86_400_000;
    await env.DB.batch([
      env.DB.prepare("DELETE FROM events WHERE ts < ?1").bind(now - RETENTION_DAYS * day),
      env.DB.prepare("DELETE FROM events WHERE type = 'ping' AND ts < ?1").bind(now - 2 * day),
      env.DB.prepare("DELETE FROM salts WHERE day < ?1").bind(utcDay(now - day)),
      env.DB.prepare("DELETE FROM login_attempts WHERE ts < ?1").bind(now - day),
      env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at < ?1").bind(now),
      env.DB.prepare("DELETE FROM gsc_cache WHERE fetched_at < ?1").bind(now - 7 * day),
    ]);
  },
} satisfies ExportedHandler<Env>;

export default worker;
