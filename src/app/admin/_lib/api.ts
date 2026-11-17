"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Same-origin JSON request to the admin API; a 401 sends the browser back to the login page. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 401 && !path.endsWith("/login")) {
    // Full navigation on purpose: the Worker gates /admin pages on the session cookie.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/admin/login");
    throw new ApiError(401, "Session expired");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

/** Fetch hook with loading / error states and optional polling. */
export function useApi<T>(path: string | null, opts: { refreshMs?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const seq = useRef(0);

  const load = useCallback(
    async (quiet = false) => {
      if (!path) return;
      const id = ++seq.current;
      if (!quiet) setLoading(true);
      try {
        const result = await api<T>(path);
        if (id === seq.current) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (id === seq.current) setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        if (id === seq.current) setLoading(false);
      }
    },
    [path],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching: the effect synchronises with the admin API
    load();
  }, [load]);

  useEffect(() => {
    if (!opts.refreshMs || !path) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, opts.refreshMs);
    return () => window.clearInterval(t);
  }, [load, opts.refreshMs, path]);

  return { data, error, loading, reload: () => load() };
}
