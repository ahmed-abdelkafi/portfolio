const enc = new TextEncoder();

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      ...(init.headers ?? {}),
    },
  });

export const error = (status: number, message: string) => json({ error: message }, { status });

export const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
export const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
export const b64url = (buf: ArrayBuffer | Uint8Array | string) =>
  (typeof buf === "string" ? btoa(unescape(encodeURIComponent(buf))) : toB64(buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const sha256 = async (text: string) => toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
export const randomToken = (bytes = 32) => toHex(crypto.getRandomValues(new Uint8Array(bytes)).buffer);

/** Constant-time comparison of two equal-length strings. */
export const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export const getCookie = (req: Request, name: string) => {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
};

export const utcDay = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 10);

/** Client IP as seen by Cloudflare. Only ever used transiently, inside a hash. */
export const clientIp = (req: Request) => req.headers.get("cf-connecting-ip") ?? "0.0.0.0";

/** Same-origin check for state-changing requests (CSRF defence on top of SameSite=Strict cookies). */
export const sameOrigin = (req: Request) => {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
};
