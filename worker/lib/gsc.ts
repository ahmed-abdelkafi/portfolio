import type { Env } from "../env";
import { b64url, error, fromB64, json } from "./util";

/**
 * Optional Google Search Console integration (read-only), via a Google Cloud service account
 * that was added as a user of the Search Console property. Nothing here is estimated: when the
 * integration is not configured the endpoint says so and returns no numbers.
 */

const CACHE_MS = 6 * 3600 * 1000;
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };

function readAccount(env: Env): ServiceAccount | null {
  if (!env.GSC_SERVICE_ACCOUNT || !env.GSC_PROPERTY) return null;
  try {
    const sa = JSON.parse(env.GSC_SERVICE_ACCOUNT) as ServiceAccount;
    return sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

async function accessToken(sa: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: sa.token_uri ?? "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  );
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", fromB64(pem), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claim}`));
  const res = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claim}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`Google token request failed (${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function query(env: Env, token: string, body: Record<string, unknown>) {
  const site = encodeURIComponent(env.GSC_PROPERTY!);
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Search Console query failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as { rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[] }).rows ?? [];
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export async function searchConsole(env: Env, url: URL) {
  const sa = readAccount(env);
  if (!sa) return json({ connected: false, property: env.GSC_PROPERTY ?? null });

  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 28), 7), 480);
  const refresh = url.searchParams.get("refresh") === "1";
  const cacheKey = `perf:${env.GSC_PROPERTY}:${days}`;
  if (!refresh) {
    const cached = await env.DB.prepare("SELECT body, fetched_at FROM gsc_cache WHERE key = ?1").bind(cacheKey).first<{ body: string; fetched_at: number }>();
    if (cached && Date.now() - cached.fetched_at < CACHE_MS) return json({ ...JSON.parse(cached.body), cachedAt: cached.fetched_at });
  }

  // Search Console data lags by ~2–3 days; the API simply returns no rows for days not yet processed.
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const range = { startDate: isoDay(start), endDate: isoDay(end) };
  try {
    const token = await accessToken(sa);
    const [totals, byDate, queries, pagesRows] = await Promise.all([
      query(env, token, { ...range }),
      query(env, token, { ...range, dimensions: ["date"] }),
      query(env, token, { ...range, dimensions: ["query"], rowLimit: 50 }),
      query(env, token, { ...range, dimensions: ["page"], rowLimit: 50 }),
    ]);
    const payload = {
      connected: true,
      property: env.GSC_PROPERTY,
      range,
      totals: totals[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      byDate: byDate.map((r) => ({ date: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
      queries: queries.map((r) => ({ query: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
      pages: pagesRows.map((r) => ({ page: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    };
    await env.DB.prepare("INSERT OR REPLACE INTO gsc_cache (key, body, fetched_at) VALUES (?1, ?2, ?3)")
      .bind(cacheKey, JSON.stringify(payload), Date.now())
      .run();
    return json({ ...payload, cachedAt: Date.now() });
  } catch (e) {
    return error(502, e instanceof Error ? e.message : "Search Console request failed");
  }
}
