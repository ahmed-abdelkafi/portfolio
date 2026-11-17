import type { Env } from "../env";
import { error, json } from "./util";

/**
 * Read-only reporting queries for the admin dashboard. Every number comes from the `events` table:
 * nothing is simulated. Visitor identity is cookie-free and resets every UTC day, so "visitors"
 * means unique visitors per day, summed over the range (documented in the dashboard).
 */

const DAY = 86_400_000;
const ENGAGED_MS = 10_000;

type Range = { from: number; to: number; prevFrom: number; prevTo: number; tz: number };

export function parseRange(url: URL): Range | null {
  const from = Number(url.searchParams.get("from"));
  const to = Number(url.searchParams.get("to"));
  const tz = Number(url.searchParams.get("tz") ?? "0");
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  if (to - from > 400 * DAY || !Number.isInteger(tz) || Math.abs(tz) > 840) return null;
  const span = to - from;
  return { from, to, prevFrom: from - span, prevTo: from, tz };
}

/** SQL expression: local calendar day of `ts` for a UTC offset in minutes. */
const dayExpr = "date((ts + ?3 * 60000) / 1000, 'unixepoch')";

/** Per-session aggregates within a time window (bound as ?1 = from, ?2 = to). */
const SESSIONS_CTE = `
  s AS (
    SELECT session,
           MIN(visitor) AS visitor,
           MIN(ts) AS started,
           MAX(ts) AS ended,
           SUM(type = 'pageview') AS pageviews,
           SUM(CASE WHEN type = 'engagement' THEN duration_ms ELSE 0 END) AS engaged_ms,
           SUM(type = 'event') AS interactions,
           MIN(is_new) AS is_new
    FROM events
    WHERE ts >= ?1 AND ts < ?2
    GROUP BY session
    HAVING SUM(type = 'pageview') > 0
  )`;

async function totals(env: Env, from: number, to: number) {
  const row = await env.DB.prepare(
    `WITH ${SESSIONS_CTE}
     SELECT
       (SELECT COUNT(*) FROM s) AS sessions,
       (SELECT COUNT(DISTINCT visitor) FROM s) AS visitors,
       (SELECT COALESCE(SUM(pageviews), 0) FROM s) AS pageviews,
       (SELECT COUNT(DISTINCT visitor) FROM s WHERE is_new = 1) AS new_visitors,
       (SELECT COUNT(DISTINCT visitor) FROM s WHERE is_new = 0) AS returning_visitors,
       (SELECT COUNT(*) FROM s WHERE engaged_ms >= ${ENGAGED_MS} OR pageviews >= 2 OR interactions > 0) AS engaged_sessions,
       (SELECT COALESCE(AVG(engaged_ms), 0) FROM s) AS avg_engagement_ms,
       (SELECT COALESCE(SUM(interactions), 0) FROM s) AS interactions`,
  )
    .bind(from, to)
    .first<Record<string, number>>();
  const r = row ?? {};
  const sessions = r.sessions ?? 0;
  return {
    visitors: r.visitors ?? 0,
    newVisitors: r.new_visitors ?? 0,
    returningVisitors: r.returning_visitors ?? 0,
    sessions,
    pageviews: r.pageviews ?? 0,
    interactions: r.interactions ?? 0,
    avgEngagementMs: Math.round(r.avg_engagement_ms ?? 0),
    engagementRate: sessions ? (r.engaged_sessions ?? 0) / sessions : 0,
    bounceRate: sessions ? 1 - (r.engaged_sessions ?? 0) / sessions : 0,
    pagesPerSession: sessions ? (r.pageviews ?? 0) / sessions : 0,
  };
}

async function dailySeries(env: Env, from: number, to: number, tz: number) {
  const { results } = await env.DB.prepare(
    `SELECT ${dayExpr} AS day,
            COUNT(DISTINCT visitor) AS visitors,
            COUNT(DISTINCT session) AS sessions,
            SUM(type = 'pageview') AS pageviews,
            COUNT(DISTINCT CASE WHEN is_new = 1 THEN visitor END) AS new_visitors,
            COUNT(DISTINCT CASE WHEN is_new = 0 THEN visitor END) AS returning_visitors
     FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview'
     GROUP BY day ORDER BY day`,
  )
    .bind(from, to, tz)
    .all<{ day: string; visitors: number; sessions: number; pageviews: number; new_visitors: number; returning_visitors: number }>();
  return results;
}

export async function overview(env: Env, r: Range) {
  const [current, previous, series, prevSeries] = await Promise.all([
    totals(env, r.from, r.to),
    totals(env, r.prevFrom, r.prevTo),
    dailySeries(env, r.from, r.to, r.tz),
    dailySeries(env, r.prevFrom, r.prevTo, r.tz),
  ]);
  return json({ current, previous, series, prevSeries });
}

export async function realtime(env: Env) {
  const now = Date.now();
  const since = now - 5 * 60_000;
  const [active, pages, recent, minutes] = await Promise.all([
    env.DB.prepare("SELECT COUNT(DISTINCT visitor) AS n FROM events WHERE ts >= ?1").bind(since).first<{ n: number }>(),
    env.DB.prepare(
      `WITH last AS (
         SELECT visitor, path, device, country,
                ROW_NUMBER() OVER (PARTITION BY visitor ORDER BY ts DESC) AS rn
         FROM events WHERE ts >= ?1 AND type IN ('pageview', 'ping'))
       SELECT path, COUNT(*) AS visitors FROM last WHERE rn = 1 GROUP BY path ORDER BY visitors DESC LIMIT 10`,
    )
      .bind(since)
      .all<{ path: string; visitors: number }>(),
    env.DB.prepare(
      `SELECT ts, path, country, region, device, browser, source FROM events
       WHERE type = 'pageview' AND ts >= ?1 ORDER BY ts DESC LIMIT 25`,
    )
      .bind(now - DAY)
      .all(),
    env.DB.prepare(
      `SELECT (ts / 60000) AS minute, COUNT(*) AS pageviews FROM events
       WHERE type = 'pageview' AND ts >= ?1 GROUP BY minute ORDER BY minute`,
    )
      .bind(now - 30 * 60_000)
      .all<{ minute: number; pageviews: number }>(),
  ]);
  const activeBreakdown = await env.DB.prepare(
    `WITH last AS (
       SELECT visitor, device, country, ROW_NUMBER() OVER (PARTITION BY visitor ORDER BY ts DESC) AS rn
       FROM events WHERE ts >= ?1)
     SELECT device, country, COUNT(*) AS visitors FROM last WHERE rn = 1 GROUP BY device, country ORDER BY visitors DESC`,
  )
    .bind(since)
    .all<{ device: string; country: string | null; visitors: number }>();
  return json({
    now,
    windowMinutes: 5,
    active: active?.n ?? 0,
    pages: pages.results,
    breakdown: activeBreakdown.results,
    recent: recent.results,
    perMinute: minutes.results.map((m) => ({ ts: m.minute * 60000, pageviews: m.pageviews })),
  });
}

export async function visitors(env: Env, r: Range) {
  const [series, current, previous, depth] = await Promise.all([
    dailySeries(env, r.from, r.to, r.tz),
    totals(env, r.from, r.to),
    totals(env, r.prevFrom, r.prevTo),
    env.DB.prepare(
      `WITH ${SESSIONS_CTE}
       SELECT CASE WHEN pageviews >= 5 THEN '5+' ELSE CAST(pageviews AS TEXT) END AS bucket, COUNT(*) AS sessions
       FROM s GROUP BY bucket ORDER BY bucket`,
    )
      .bind(r.from, r.to)
      .all<{ bucket: string; sessions: number }>(),
  ]);
  return json({ series, current, previous, depth: depth.results });
}

export async function sources(env: Env, r: Range) {
  const query = (from: number, to: number) =>
    env.DB.prepare(
      `WITH ${SESSIONS_CTE},
       src AS (
         SELECT session, source, medium, campaign,
                ROW_NUMBER() OVER (PARTITION BY session ORDER BY ts) AS rn
         FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview')
       SELECT src.source, src.medium, COALESCE(src.campaign, '') AS campaign,
              COUNT(DISTINCT s.visitor) AS visitors,
              COUNT(*) AS sessions,
              SUM(s.engaged_ms >= ${ENGAGED_MS} OR s.pageviews >= 2 OR s.interactions > 0) AS engaged,
              AVG(s.engaged_ms) AS avg_engagement_ms
       FROM src JOIN s ON s.session = src.session
       WHERE src.rn = 1
       GROUP BY src.source, src.medium, campaign
       ORDER BY sessions DESC LIMIT 100`,
    )
      .bind(from, to)
      .all<{ source: string; medium: string; campaign: string; visitors: number; sessions: number; engaged: number; avg_engagement_ms: number }>();
  const [cur, prev] = await Promise.all([query(r.from, r.to), query(r.prevFrom, r.prevTo)]);
  return json({ rows: cur.results, previous: prev.results });
}

export async function geography(env: Env, r: Range) {
  const [countries, regions, trend, prev] = await Promise.all([
    env.DB.prepare(
      `SELECT COALESCE(country, 'XX') AS country, COUNT(DISTINCT visitor) AS visitors,
              COUNT(DISTINCT session) AS sessions, SUM(type = 'pageview') AS pageviews
       FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview'
       GROUP BY country ORDER BY visitors DESC`,
    )
      .bind(r.from, r.to)
      .all(),
    env.DB.prepare(
      `SELECT COALESCE(country, 'XX') AS country, COALESCE(region, 'Unknown') AS region, COUNT(DISTINCT visitor) AS visitors
       FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview'
       GROUP BY country, region ORDER BY visitors DESC LIMIT 200`,
    )
      .bind(r.from, r.to)
      .all(),
    env.DB.prepare(
      `SELECT ${dayExpr} AS day, COALESCE(country, 'XX') AS country, COUNT(DISTINCT visitor) AS visitors
       FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview'
       GROUP BY day, country ORDER BY day`,
    )
      .bind(r.from, r.to, r.tz)
      .all(),
    env.DB.prepare(
      `SELECT COALESCE(country, 'XX') AS country, COUNT(DISTINCT visitor) AS visitors
       FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview' GROUP BY country`,
    )
      .bind(r.prevFrom, r.prevTo)
      .all(),
  ]);
  return json({ countries: countries.results, regions: regions.results, trend: trend.results, previous: prev.results });
}

export async function devices(env: Env, r: Range) {
  const dim = (col: "device" | "os" | "browser" | "screen") =>
    env.DB.prepare(
      // Alias must not be "name": that is also a column of `events`, and GROUP BY would bind to the column.
      `SELECT COALESCE(${col}, 'unknown') AS dim_value, COUNT(DISTINCT visitor) AS visitors, COUNT(DISTINCT session) AS sessions
       FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview'
       GROUP BY dim_value ORDER BY visitors DESC`,
    )
      .bind(r.from, r.to)
      .all<{ dim_value: string; visitors: number; sessions: number }>();
  const rows = (res: { results: { dim_value: string; visitors: number; sessions: number }[] }) =>
    res.results.map((x) => ({ name: x.dim_value, visitors: x.visitors, sessions: x.sessions }));
  const [device, os, browser, screen] = await Promise.all([dim("device"), dim("os"), dim("browser"), dim("screen")]);
  return json({ device: rows(device), os: rows(os), browser: rows(browser), screen: rows(screen) });
}

export async function pages(env: Env, r: Range) {
  const [top, entries, exits, projects, clicks] = await Promise.all([
    env.DB.prepare(
      `WITH pv AS (SELECT id, path, visitor FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview'),
            eng AS (SELECT pv, SUM(duration_ms) AS ms FROM events WHERE ts >= ?1 AND ts < ?2 + 3600000 AND type = 'engagement' GROUP BY pv)
       SELECT pv.path, COUNT(*) AS pageviews, COUNT(DISTINCT pv.visitor) AS visitors, AVG(COALESCE(eng.ms, 0)) AS avg_engagement_ms
       FROM pv LEFT JOIN eng ON eng.pv = pv.id
       GROUP BY pv.path ORDER BY pageviews DESC LIMIT 50`,
    )
      .bind(r.from, r.to)
      .all(),
    env.DB.prepare(
      `WITH o AS (SELECT session, path, ROW_NUMBER() OVER (PARTITION BY session ORDER BY ts) AS rn
                  FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview')
       SELECT path, COUNT(*) AS sessions FROM o WHERE rn = 1 GROUP BY path ORDER BY sessions DESC LIMIT 20`,
    )
      .bind(r.from, r.to)
      .all(),
    env.DB.prepare(
      `WITH o AS (SELECT session, path, ROW_NUMBER() OVER (PARTITION BY session ORDER BY ts DESC) AS rn
                  FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview')
       SELECT path, COUNT(*) AS sessions FROM o WHERE rn = 1 GROUP BY path ORDER BY sessions DESC LIMIT 20`,
    )
      .bind(r.from, r.to)
      .all(),
    env.DB.prepare(
      `WITH pv AS (SELECT id, path, visitor FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'pageview' AND path LIKE '/%/work/%'),
            eng AS (SELECT pv, SUM(duration_ms) AS ms FROM events WHERE ts >= ?1 AND ts < ?2 + 3600000 AND type = 'engagement' GROUP BY pv)
       SELECT substr(pv.path, instr(substr(pv.path, 2), '/work/') + 7) AS slug,
              COUNT(*) AS views, COUNT(DISTINCT pv.visitor) AS visitors, AVG(COALESCE(eng.ms, 0)) AS avg_engagement_ms
       FROM pv LEFT JOIN eng ON eng.pv = pv.id
       GROUP BY slug ORDER BY views DESC`,
    )
      .bind(r.from, r.to)
      .all(),
    env.DB.prepare(
      `SELECT target AS slug, COUNT(*) AS clicks, COUNT(DISTINCT visitor) AS visitors
       FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'event' AND name = 'project_click' AND target IS NOT NULL
       GROUP BY target ORDER BY clicks DESC`,
    )
      .bind(r.from, r.to)
      .all(),
  ]);
  return json({ top: top.results, entries: entries.results, exits: exits.results, projects: projects.results, projectClicks: clicks.results });
}

export async function behavior(env: Env, r: Range) {
  const [events, targets, series, prev] = await Promise.all([
    env.DB.prepare(
      `SELECT name, COUNT(*) AS count, COUNT(DISTINCT visitor) AS visitors
       FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'event' GROUP BY name ORDER BY count DESC`,
    )
      .bind(r.from, r.to)
      .all(),
    env.DB.prepare(
      `SELECT name, COALESCE(target, '—') AS target, COUNT(*) AS count
       FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'event' GROUP BY name, target ORDER BY count DESC LIMIT 100`,
    )
      .bind(r.from, r.to)
      .all(),
    env.DB.prepare(
      `SELECT ${dayExpr} AS day, COUNT(*) AS count FROM events
       WHERE ts >= ?1 AND ts < ?2 AND type = 'event' GROUP BY day ORDER BY day`,
    )
      .bind(r.from, r.to, r.tz)
      .all(),
    env.DB.prepare(
      `SELECT name, COUNT(*) AS count FROM events WHERE ts >= ?1 AND ts < ?2 AND type = 'event' GROUP BY name`,
    )
      .bind(r.prevFrom, r.prevTo)
      .all(),
  ]);
  return json({ events: events.results, targets: targets.results, series: series.results, previous: prev.results });
}

export const badRange = () => error(400, "Invalid date range");
