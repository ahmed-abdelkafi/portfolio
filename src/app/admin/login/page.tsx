"use client";

import { useState } from "react";
import { ApiError, api } from "../_lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full navigation so the Worker sees the new session cookie
      window.location.assign("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed. Check your connection.");
      setPassword("");
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[var(--ink)] p-12 text-[var(--bone)] lg:flex lg:flex-col lg:justify-between">
        <p className="label !text-[var(--muted-dark)]">ahmed-abdelkafi.dev · private</p>
        <div>
          <p className="display text-[clamp(80px,9vw,150px)]">
            Control
            <br />
            room<span className="text-[var(--red)]">.</span>
          </p>
          <p className="serif mt-6 max-w-md text-3xl leading-snug text-[var(--muted-dark)]">Who watched the film, from where, and what they kept.</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--red)] text-[15px] font-extrabold [font-stretch:62%]">A.A.</span>
          <p className="label !text-[var(--muted-dark)]">Cookie-free analytics · Cloudflare D1</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <p className="label">Administrator</p>
          <h1 className="display mt-3 text-6xl">Sign in</h1>
          <div className="mt-12 space-y-8">
            <div>
              <label htmlFor="u" className="label">
                Username
              </label>
              <input id="u" className="field" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
            <div>
              <label htmlFor="p" className="label">
                Password
              </label>
              <input id="p" type="password" className="field" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-6 border-l-2 border-[var(--red)] bg-[var(--red-soft)] px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <button type="submit" className="btn-adm mt-10 w-full justify-center" disabled={busy || !username || !password}>
            {busy ? "Checking…" : "Enter the control room →"}
          </button>
          <p className="mt-8 text-[12.5px] leading-relaxed text-[var(--muted)]">
            Private area. Five failed attempts lock sign-in for 15 minutes. There is no public registration.
          </p>
        </form>
      </section>
    </main>
  );
}
