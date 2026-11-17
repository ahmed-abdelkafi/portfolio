import type { Env } from "../env";
import { error, json, sameOrigin, utcDay } from "./util";

/**
 * Email alert for each new visit (one per session, never per page), sent through Cloudflare
 * Email Routing to a verified address. Contains only what the dashboard shows: approximate
 * location, source, device and entry page. Capped per day; can be switched off in Settings.
 */

export type VisitInfo = {
  path: string;
  country: string | null;
  region: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  device: string;
  os: string;
  browser: string;
  returning: boolean;
  ts: number;
};

const PROJECTS: Record<string, string> = {
  "lines-up": "Lines Up",
  qrbase: "QRBase",
  dinertia: "Dinertia",
  bitgrass: "Bitgrass",
  "legal-tech": "Legal-Tech",
  "survey-engine": "Survey Engine",
  videokit: "VideoKit",
};

const countryName = (code: string | null) => {
  if (!code || code === "XX") return "Unknown country";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};
const flag = (code: string | null) =>
  code && /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1"
    ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : "🌐";
const pageLabel = (path: string) => {
  const m = path.match(/^\/(en|fr)(?:\/work\/([a-z0-9-]+)|\/(privacy))?$/);
  if (!m) return path;
  if (m[2]) return `${PROJECTS[m[2]] ?? m[2]} case study (${m[1].toUpperCase()})`;
  if (m[3]) return `Privacy (${m[1].toUpperCase()})`;
  return `Home (${m[1].toUpperCase()})`;
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

async function getSettings(env: Env) {
  const { results } = await env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('notify_enabled', 'notify_daily_cap')").all<{
    key: string;
    value: string;
  }>();
  const map = new Map(results.map((r) => [r.key, r.value]));
  return { enabled: map.get("notify_enabled") !== "0", dailyCap: Math.max(1, Math.min(500, Number(map.get("notify_daily_cap") ?? 30) || 30)) };
}

const configured = (env: Env) => Boolean(env.NOTIFY && env.NOTIFY_FROM && env.NOTIFY_TO);

async function send(env: Env, subject: string, text: string, html: string) {
  await env.NOTIFY!.send({
    from: { name: "ahmed-abdelkafi.dev", email: env.NOTIFY_FROM! },
    to: env.NOTIFY_TO!,
    subject,
    text,
    html,
  });
}

function render(env: Env, v: VisitInfo, countToday: number, cap: number) {
  const when = new Date(v.ts).toLocaleString("en-GB", { timeZone: "Africa/Tunis", dateStyle: "medium", timeStyle: "short" });
  const where = `${countryName(v.country)}${v.region ? ` · ${v.region}` : ""}`;
  const via = v.source && v.source !== "Direct" ? `${v.source}${v.medium && v.medium !== "none" ? ` (${v.medium})` : ""}${v.campaign ? ` · campaign ${v.campaign}` : ""}` : "Direct (typed or bookmarked)";
  const device = `${v.device[0].toUpperCase()}${v.device.slice(1)} · ${v.os} · ${v.browser}`;
  const admin = `${env.SITE_URL.replace(/\/$/, "")}/admin/realtime`;
  const subject = `${flag(v.country)} New visit · ${countryName(v.country)} · ${v.source ?? "Direct"}`;
  const rows: [string, string][] = [
    ["From", where],
    ["Came via", via],
    ["Landed on", pageLabel(v.path)],
    ["Device", device],
    ["Visitor", v.returning ? "Returning (has visited before)" : "New"],
    ["Time", `${when} (Tunis)`],
  ];
  const footer = `Alert ${countToday}/${cap} today. Turn alerts off or change the cap in Admin → Settings.`;
  const text = `${rows.map(([k, val]) => `${k}: ${val}`).join("\n")}\n\nLive view: ${admin}\n\n${footer}\n`;
  const html = `<!doctype html><html><body style="margin:0;background:#f2ede3;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ede3;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#f2ede3;border:1px solid #d9d3c8">
<tr><td style="background:#1c1c1c;color:#f2ede3;padding:18px 22px">
<div style="font:11px/1.4 'Courier New',monospace;letter-spacing:2px;text-transform:uppercase;color:#a39e95">ahmed-abdelkafi.dev · new visit</div>
<div style="font:bold 26px/1.15 Arial,Helvetica,sans-serif;margin-top:6px">${esc(flag(v.country))} ${esc(where)}</div>
</td></tr>
<tr><td style="padding:8px 22px 4px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${rows
  .map(
    ([k, val]) =>
      `<tr><td style="padding:10px 0;border-bottom:1px solid #e2dccf;font:11px 'Courier New',monospace;letter-spacing:1px;text-transform:uppercase;color:#7d786f;width:110px;vertical-align:top">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #e2dccf;font-size:15px">${esc(val)}</td></tr>`,
  )
  .join("\n")}
</table></td></tr>
<tr><td style="padding:18px 22px 22px"><a href="${esc(admin)}" style="display:inline-block;background:#b3261e;color:#f2ede3;text-decoration:none;font:bold 13px Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;padding:12px 18px">Open live view →</a>
<p style="font-size:12px;color:#7d786f;margin:16px 0 0">${esc(footer)}</p></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

/** Called (via waitUntil) when /api/collect opens a new session. Never throws. */
export async function notifyNewVisit(env: Env, v: VisitInfo) {
  try {
    if (!configured(env)) return;
    const s = await getSettings(env);
    if (!s.enabled) return;
    const row = await env.DB.prepare(
      `INSERT INTO notify_log (day, count) VALUES (?1, 1)
       ON CONFLICT(day) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
      .bind(utcDay(v.ts))
      .first<{ count: number }>();
    const count = row?.count ?? 1;
    if (count > s.dailyCap) return;
    const { subject, text, html } = render(env, v, count, s.dailyCap);
    await send(env, subject, text, html);
  } catch (e) {
    console.error("visit notification failed", e instanceof Error ? e.message : e);
  }
}

/* ───── Admin endpoints ───── */

export async function notificationSettings(env: Env) {
  const s = await getSettings(env);
  const today = await env.DB.prepare("SELECT count FROM notify_log WHERE day = ?1").bind(utcDay()).first<{ count: number }>();
  return json({ ...s, configured: configured(env), to: env.NOTIFY_TO ?? null, sentToday: Math.min(today?.count ?? 0, s.dailyCap) });
}

export async function updateNotificationSettings(req: Request, env: Env) {
  if (!sameOrigin(req)) return error(403, "Forbidden");
  const b = (await req.json().catch(() => ({}))) as { enabled?: unknown; dailyCap?: unknown };
  const stmts = [];
  if (typeof b.enabled === "boolean") {
    stmts.push(env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('notify_enabled', ?1)").bind(b.enabled ? "1" : "0"));
  }
  if (typeof b.dailyCap === "number" && Number.isInteger(b.dailyCap) && b.dailyCap >= 1 && b.dailyCap <= 500) {
    stmts.push(env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('notify_daily_cap', ?1)").bind(String(b.dailyCap)));
  }
  if (!stmts.length) return error(400, "Nothing to update");
  await env.DB.batch(stmts);
  return notificationSettings(env);
}

export async function sendTestNotification(req: Request, env: Env) {
  if (!sameOrigin(req)) return error(403, "Forbidden");
  if (!configured(env)) return error(400, "Email alerts are not configured on the Worker");
  const s = await getSettings(env);
  const { subject, text, html } = render(
    env,
    { path: "/en/work/lines-up", country: "TN", region: "Sfax Governorate", source: "LinkedIn", medium: "social", campaign: null, device: "mobile", os: "iOS", browser: "Safari", returning: false, ts: Date.now() },
    0,
    s.dailyCap,
  );
  try {
    await send(env, `[TEST] ${subject}`, `This is a test alert (sample data).\n\n${text}`, html.replace("new visit", "test alert · sample data"));
    return json({ ok: true });
  } catch (e) {
    return error(502, e instanceof Error ? e.message : "Sending failed");
  }
}
