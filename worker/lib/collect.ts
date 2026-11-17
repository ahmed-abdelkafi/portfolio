import type { Env } from "../env";
import { currentAdmin } from "./auth";
import { classifySource } from "./source";
import { isBot, parseUA, screenBucket } from "./ua";
import { clientIp, randomToken, sha256, utcDay } from "./util";

const SESSION_GAP_MS = 30 * 60 * 1000;
const MAX_EVENTS_PER_MINUTE = 60;
const TYPES = new Set(["pageview", "engagement", "event", "ping"]);
/** Allowed interaction names: consistent snake_case, nothing free-form. */
export const EVENT_NAMES = new Set([
  "project_click",
  "case_study_view",
  "contact_click",
  "email_click",
  "phone_click",
  "whatsapp_click",
  "linkedin_click",
  "github_click",
  "live_site_click",
  "cv_download",
  "nav_click",
  "theme_change",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PATH_RE = /^\/[a-z0-9\-/]{0,120}$/i;
const TOKEN_RE = /^[a-z0-9_.:\-/]{1,80}$/i;

const noContent = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

async function dailySalt(env: Env, day: string) {
  const existing = await env.DB.prepare("SELECT salt FROM salts WHERE day = ?1").bind(day).first<{ salt: string }>();
  if (existing) return existing.salt;
  await env.DB.prepare("INSERT OR IGNORE INTO salts (day, salt) VALUES (?1, ?2)").bind(day, randomToken(32)).run();
  return (await env.DB.prepare("SELECT salt FROM salts WHERE day = ?1").bind(day).first<{ salt: string }>())!.salt;
}

/**
 * POST /api/collect — cookie-free event intake.
 * Always answers 204 so callers learn nothing about filtering decisions.
 */
export async function collect(req: Request, env: Env) {
  const hosts = env.SITE_HOSTS.split(",").map((h) => h.trim().toLowerCase());
  const origin = req.headers.get("origin");
  let originHost = "";
  try {
    originHost = origin ? new URL(origin).hostname.toLowerCase() : "";
  } catch {
    return noContent();
  }
  if (!hosts.includes(originHost)) return noContent(); // localhost, previews, third-party pages

  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return noContent();
  const cf = (req as Request & { cf?: IncomingRequestCfProperties }).cf;
  if (cf?.botManagement?.verifiedBot) return noContent();
  if (req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1") return noContent(); // honour browser privacy signals
  if (await currentAdmin(req, env)) return noContent(); // never count the administrator

  const raw = await req.text();
  if (raw.length > 2048) return noContent();
  let b: Record<string, unknown>;
  try {
    b = JSON.parse(raw);
  } catch {
    return noContent();
  }

  const id = typeof b.id === "string" && UUID_RE.test(b.id) ? b.id : null;
  const type = typeof b.type === "string" && TYPES.has(b.type) ? b.type : null;
  const path = typeof b.path === "string" && PATH_RE.test(b.path) ? b.path.replace(/\/+$/, "") || "/" : null;
  if (!id || !type || !path) return noContent();
  if (path.startsWith("/admin") || path.startsWith("/api")) return noContent();

  const name = type === "event" ? (typeof b.name === "string" && EVENT_NAMES.has(b.name) ? b.name : null) : null;
  if (type === "event" && !name) return noContent();
  const pv = typeof b.pv === "string" && UUID_RE.test(b.pv) ? b.pv : null;
  const locale = b.locale === "en" || b.locale === "fr" ? b.locale : null;
  const target = typeof b.target === "string" && TOKEN_RE.test(b.target) ? b.target.toLowerCase() : null;
  const duration = typeof b.dur === "number" && Number.isFinite(b.dur) ? Math.max(0, Math.min(Math.round(b.dur), 30 * 60 * 1000)) : null;
  const width = typeof b.w === "number" && Number.isFinite(b.w) ? b.w : 0;
  const returning = b.ret === true;

  let refHost: string | null = null;
  if (typeof b.ref === "string" && b.ref) {
    try {
      const h = new URL(b.ref).hostname.toLowerCase().replace(/^www\./, "");
      refHost = hosts.includes(h) || hosts.includes(`www.${h}`) ? null : h.slice(0, 100);
    } catch {
      refHost = null;
    }
  }
  const utm = (b.utm && typeof b.utm === "object" ? b.utm : {}) as Record<string, unknown>;

  const now = Date.now();
  const salt = await dailySalt(env, utcDay(now));
  const visitor = await sha256(`${salt}|${clientIp(req)}|${ua}|${originHost}`);

  const recent = await env.DB.prepare(
    `SELECT (SELECT session FROM events WHERE visitor = ?1 AND ts > ?2 ORDER BY ts DESC LIMIT 1) AS session,
            (SELECT COUNT(*) FROM events WHERE visitor = ?1 AND ts > ?3) AS burst`,
  )
    .bind(visitor, now - SESSION_GAP_MS, now - 60_000)
    .first<{ session: string | null; burst: number }>();
  if ((recent?.burst ?? 0) >= MAX_EVENTS_PER_MINUTE) return noContent();
  // A heartbeat or engagement beacon never opens a new session on its own.
  if (!recent?.session && type !== "pageview") return noContent();
  const session = recent?.session ?? randomToken(16);

  const { device, os, browser } = parseUA(ua);
  const { source, medium, campaign } = type === "pageview" ? classifySource(refHost, utm) : { source: null, medium: null, campaign: null };

  await env.DB.prepare(
    `INSERT OR IGNORE INTO events
       (id, ts, type, name, pv, path, locale, visitor, session, is_new, ref_host, source, medium, campaign,
        country, region, device, os, browser, screen, duration_ms, target)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)`,
  )
    .bind(
      id,
      now,
      type,
      name,
      pv,
      path,
      locale,
      visitor,
      session,
      returning ? 0 : 1,
      type === "pageview" ? refHost : null,
      source,
      medium,
      campaign,
      typeof cf?.country === "string" ? cf.country.slice(0, 2) : null,
      typeof cf?.region === "string" ? cf.region.slice(0, 80) : null,
      device,
      os,
      browser,
      width ? screenBucket(width) : null,
      duration,
      target,
    )
    .run();
  return noContent();
}
