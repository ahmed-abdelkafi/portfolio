import type { Env } from "../env";
import { clientIp, error, fromB64, getCookie, json, randomToken, safeEqual, sameOrigin, sha256, toB64 } from "./util";

export const SESSION_COOKIE = "__Host-aa_session";
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;
const PBKDF2_ITERATIONS = 100_000; // maximum supported by the Workers runtime
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_CLIENT = 5;
const MAX_FAILS_PER_ACCOUNT = 20;

export type Admin = { id: number; username: string };

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}

export async function hashPassword(password: string, iterations = PBKDF2_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, iterations);
  return ["pbkdf2-sha256", iterations, toB64(salt), toB64(hash)].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iter, saltB64, hashB64] = stored.split("$");
  if (scheme !== "pbkdf2-sha256" || !iter || !saltB64 || !hashB64) return false;
  const n = Number(iter);
  if (!Number.isInteger(n) || n < 10_000 || n > PBKDF2_ITERATIONS) return false;
  const derived = await pbkdf2(password, fromB64(saltB64), n);
  return safeEqual(toB64(derived), hashB64);
}

// Hash of a random, discarded password: an unknown username costs the same time as a real one.
const DUMMY_HASH = ["pbkdf2-sha256", 100000, "AAAAAAAAAAAAAAAAAAAAAA==", "/pAqq9Q8mYFaVReU82rzFZ81HriUQoJql2QY/mlFPt0="].join("$");

const sessionCookie = (token: string, maxAgeSec: number) =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec}`;

/** Server-side authorization: every admin API call and every /admin page goes through this. */
export async function currentAdmin(req: Request, env: Env): Promise<Admin | null> {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = await env.DB.prepare(
    `SELECT a.id, a.username FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = ?1 AND s.expires_at > ?2`,
  )
    .bind(await sha256(token), Date.now())
    .first<Admin>();
  return row ?? null;
}

export async function login(req: Request, env: Env) {
  if (!sameOrigin(req)) return error(403, "Forbidden");
  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return error(400, "Invalid request");
  }
  const username = typeof body.username === "string" ? body.username.trim().slice(0, 64) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 256) : "";
  if (!username || !password) return error(400, "Username and password are required");

  const now = Date.now();
  const clientKey = await sha256(`login:${clientIp(req)}`);
  const accountKey = await sha256(`account:${username.toLowerCase()}`);
  const counts = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM login_attempts WHERE key = ?1 AND ts > ?3) AS c,
            (SELECT COUNT(*) FROM login_attempts WHERE key = ?2 AND ts > ?3) AS a`,
  )
    .bind(clientKey, accountKey, now - WINDOW_MS)
    .first<{ c: number; a: number }>();
  if ((counts?.c ?? 0) >= MAX_FAILS_PER_CLIENT || (counts?.a ?? 0) >= MAX_FAILS_PER_ACCOUNT) {
    return error(429, "Too many attempts. Try again in 15 minutes.");
  }

  const admin = await env.DB.prepare("SELECT id, username, pw_hash FROM admins WHERE username = ?1 COLLATE NOCASE")
    .bind(username)
    .first<{ id: number; username: string; pw_hash: string }>();
  const ok = await verifyPassword(password, admin?.pw_hash ?? DUMMY_HASH);
  if (!admin || !ok) {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO login_attempts (key, ts) VALUES (?1, ?2)").bind(clientKey, now),
      env.DB.prepare("INSERT INTO login_attempts (key, ts) VALUES (?1, ?2)").bind(accountKey, now),
    ]);
    return error(401, "Invalid username or password");
  }

  const token = randomToken(32);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO admin_sessions (token_hash, admin_id, created_at, expires_at, ua) VALUES (?1, ?2, ?3, ?4, ?5)").bind(
      await sha256(token),
      admin.id,
      now,
      now + SESSION_TTL_MS,
      (req.headers.get("user-agent") ?? "").slice(0, 200),
    ),
    env.DB.prepare("DELETE FROM login_attempts WHERE key = ?1").bind(clientKey),
  ]);
  return json({ ok: true, username: admin.username }, { headers: { "set-cookie": sessionCookie(token, SESSION_TTL_MS / 1000) } });
}

export async function logout(req: Request, env: Env) {
  if (!sameOrigin(req)) return error(403, "Forbidden");
  const token = getCookie(req, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?1").bind(await sha256(token)).run();
  return json({ ok: true }, { headers: { "set-cookie": sessionCookie("", 0) } });
}

export async function changePassword(req: Request, env: Env, admin: Admin) {
  if (!sameOrigin(req)) return error(403, "Forbidden");
  const body = (await req.json().catch(() => ({}))) as { current?: unknown; next?: unknown };
  const current = typeof body.current === "string" ? body.current : "";
  const next = typeof body.next === "string" ? body.next : "";
  if (next.length < 12 || next.length > 256) return error(400, "The new password must be 12 to 256 characters long");
  const row = await env.DB.prepare("SELECT pw_hash FROM admins WHERE id = ?1").bind(admin.id).first<{ pw_hash: string }>();
  if (!row || !(await verifyPassword(current, row.pw_hash))) return error(401, "Current password is incorrect");
  const token = getCookie(req, SESSION_COOKIE) ?? "";
  await env.DB.batch([
    env.DB.prepare("UPDATE admins SET pw_hash = ?1, updated_at = ?2 WHERE id = ?3").bind(await hashPassword(next), Date.now(), admin.id),
    // Sign out every other session.
    env.DB.prepare("DELETE FROM admin_sessions WHERE admin_id = ?1 AND token_hash != ?2").bind(admin.id, await sha256(token)),
  ]);
  return json({ ok: true });
}

export async function listSessions(req: Request, env: Env, admin: Admin) {
  const mine = await sha256(getCookie(req, SESSION_COOKIE) ?? "");
  const { results } = await env.DB.prepare(
    "SELECT token_hash, created_at, expires_at, ua FROM admin_sessions WHERE admin_id = ?1 AND expires_at > ?2 ORDER BY created_at DESC",
  )
    .bind(admin.id, Date.now())
    .all<{ token_hash: string; created_at: number; expires_at: number; ua: string }>();
  return json({
    sessions: results.map((s) => ({ current: s.token_hash === mine, createdAt: s.created_at, expiresAt: s.expires_at, ua: s.ua })),
  });
}

export async function revokeOtherSessions(req: Request, env: Env, admin: Admin) {
  if (!sameOrigin(req)) return error(403, "Forbidden");
  const mine = await sha256(getCookie(req, SESSION_COOKIE) ?? "");
  await env.DB.prepare("DELETE FROM admin_sessions WHERE admin_id = ?1 AND token_hash != ?2").bind(admin.id, mine).run();
  return json({ ok: true });
}
