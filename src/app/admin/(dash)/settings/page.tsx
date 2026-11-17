"use client";

import { useEffect, useState } from "react";
import { api, ApiError, useApi } from "../../_lib/api";
import { num } from "../../_lib/format";
import { Async, Panel } from "../../_components/ui";

type Settings = {
  username: string;
  retentionDays: number;
  hosts: string[];
  searchConsole: { configured: boolean; property: string | null };
  storage: { events: number; first: number | null; last: number | null };
};
type Sessions = { sessions: { current: boolean; createdAt: number; expiresAt: number; ua: string }[] };

const OPT_OUT_KEY = "aa-optout";

export default function SettingsPage() {
  const settings = useApi<Settings>("/api/admin/settings");
  const sessions = useApi<Sessions>("/api/admin/sessions");

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Email alerts" note="One email per new visit">
        <NotificationSettings />
      </Panel>

      <Panel title="Exclude this device" note="Your own visits">
        <DeviceExclusion />
      </Panel>

      <Panel title="Change password">
        <PasswordForm onDone={sessions.reload} />
      </Panel>

      <Panel
        title="Active sessions"
        action={
          <button
            type="button"
            className="chip"
            aria-pressed="false"
            onClick={async () => {
              await api("/api/admin/sessions/revoke", { method: "POST" });
              sessions.reload();
            }}
          >
            Sign out other devices
          </button>
        }
      >
        <Async state={sessions}>
          {(d) => (
            <ul className="divide-y divide-[var(--line)]">
              {d.sessions.map((s) => (
                <li key={s.createdAt} className="flex items-center justify-between gap-4 py-3 text-[13px]">
                  <span className="min-w-0">
                    <span className="block truncate" title={s.ua}>
                      {s.ua || "Unknown browser"}
                    </span>
                    <span className="label">
                      Since {new Date(s.createdAt).toLocaleString()} · expires {new Date(s.expiresAt).toLocaleDateString()}
                    </span>
                  </span>
                  {s.current && <span className="chip !border-[var(--red)] !text-[var(--red)]">This device</span>}
                </li>
              ))}
            </ul>
          )}
        </Async>
      </Panel>

      <Panel title="Data & privacy">
        <Async state={settings}>
          {(s) => (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13.5px]">
              <dt className="label pt-0.5">Account</dt>
              <dd>{s.username}</dd>
              <dt className="label pt-0.5">Events stored</dt>
              <dd className="mono">
                {num(s.storage.events)}
                {s.storage.first ? ` · since ${new Date(s.storage.first).toLocaleDateString()}` : ""}
              </dd>
              <dt className="label pt-0.5">Retention</dt>
              <dd>Detailed events deleted after {s.retentionDays} days; heartbeats after 2 days; daily salts after 2 days.</dd>
              <dt className="label pt-0.5">Counted hosts</dt>
              <dd className="mono">{s.hosts.join(", ")}</dd>
              <dt className="label pt-0.5">Excluded</dt>
              <dd>Signed-in administrator, opted-out devices, Do Not Track / Global Privacy Control, bots and crawlers, localhost.</dd>
              <dt className="label pt-0.5">Search Console</dt>
              <dd>{s.searchConsole.configured ? `Connected · ${s.searchConsole.property}` : "Not connected (see SEO performance)"}</dd>
              <dt className="label pt-0.5">Privacy notice</dt>
              <dd>
                <a className="underline decoration-[var(--red)] underline-offset-4" href="/en/privacy" target="_blank" rel="noreferrer">
                  /en/privacy
                </a>{" "}
                ·{" "}
                <a className="underline decoration-[var(--red)] underline-offset-4" href="/fr/privacy" target="_blank" rel="noreferrer">
                  /fr/privacy
                </a>
              </dd>
            </dl>
          )}
        </Async>
      </Panel>
    </div>
  );
}

function DeviceExclusion() {
  const [excluded, setExcluded] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read a per-device flag after hydration
      setExcluded(window.localStorage.getItem(OPT_OUT_KEY) === "1");
    } catch {
      setExcluded(false);
    }
  }, []);
  const toggle = () => {
    try {
      if (excluded) window.localStorage.removeItem(OPT_OUT_KEY);
      else window.localStorage.setItem(OPT_OUT_KEY, "1");
      setExcluded(!excluded);
    } catch {
      /* storage blocked */
    }
  };
  return (
    <div className="space-y-5">
      <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
        While you are signed in, your visits are never counted. To also exclude this browser when you are signed out (e.g. checking the site on your phone), turn exclusion on here, on each device you use.
      </p>
      <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
        <span className="text-[14px] font-medium">{excluded === null ? "…" : excluded ? "This device is excluded" : "This device is counted"}</span>
        <button type="button" className={`btn-adm ${excluded ? "btn-ghost" : ""}`} onClick={toggle} disabled={excluded === null}>
          {excluded ? "Count this device again" : "Exclude this device"}
        </button>
      </div>
    </div>
  );
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = next.length >= 12 && next === confirm && current.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/password", { method: "POST", body: JSON.stringify({ current, next }) });
      setMsg({ ok: true, text: "Password changed. Other devices were signed out." });
      setCurrent("");
      setNext("");
      setConfirm("");
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Could not change the password." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label" htmlFor="pc">
          Current password
        </label>
        <input id="pc" type="password" className="field" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pn">
            New password (12+)
          </label>
          <input id="pn" type="password" className="field" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pk">
            Confirm
          </label>
          <input id="pk" type="password" className="field" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </div>
      {next && confirm && next !== confirm && <p className="text-[12.5px] text-[var(--red)]">The new passwords do not match.</p>}
      {msg && (
        <p role="status" className={`text-[13px] ${msg.ok ? "" : "text-[var(--red)]"}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" className="btn-adm" disabled={!valid || busy}>
        {busy ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

type Notif = { enabled: boolean; dailyCap: number; configured: boolean; to: string | null; sentToday: number };

function NotificationSettings() {
  const state = useApi<Notif>("/api/admin/notifications");
  const [cap, setCap] = useState<string>("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (patch: Partial<Pick<Notif, "enabled" | "dailyCap">>) => {
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/notifications", { method: "POST", body: JSON.stringify(patch) });
      state.reload();
      setMsg({ ok: true, text: "Saved." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  };
  const test = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/notifications/test", { method: "POST" });
      setMsg({ ok: true, text: "Test email sent. Check your inbox (and spam folder the first time)." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Sending failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Async state={state}>
      {(n) => (
        <div className="space-y-5">
          <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
            When someone opens the portfolio, you receive one email per visit (not per page) with the approximate country, where they came from, the page they landed on and their device. No personal data. Your own visits never trigger an alert.
          </p>
          {!n.configured && (
            <p className="border-l-2 border-[var(--red)] bg-[var(--red-soft)] px-3 py-2 text-[13px]">
              Email sending is not configured on the Worker yet (Cloudflare Email Routing).
            </p>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13.5px]">
            <dt className="label pt-0.5">Sent to</dt>
            <dd className="mono text-[12.5px]">{n.to ?? "—"}</dd>
            <dt className="label pt-0.5">Today</dt>
            <dd className="mono text-[12.5px]">
              {n.sentToday} / {n.dailyCap} alerts
            </dd>
          </dl>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
            <span className="text-[14px] font-medium">{n.enabled ? "Alerts are on" : "Alerts are off"}</span>
            <button type="button" className={`btn-adm ${n.enabled ? "btn-ghost" : ""}`} disabled={busy} onClick={() => save({ enabled: !n.enabled })}>
              {n.enabled ? "Turn alerts off" : "Turn alerts on"}
            </button>
          </div>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const v = Number(cap);
              if (Number.isInteger(v) && v >= 1 && v <= 500) save({ dailyCap: v });
            }}
          >
            <div>
              <label className="label" htmlFor="cap">
                Max alerts per day
              </label>
              <input id="cap" type="number" min={1} max={500} placeholder={String(n.dailyCap)} value={cap} onChange={(e) => setCap(e.target.value)} className="field w-28" />
            </div>
            <button type="submit" className="btn-adm btn-ghost" disabled={busy || !cap}>
              Save limit
            </button>
            <button type="button" className="btn-adm" disabled={busy || !n.configured} onClick={test}>
              Send a test email
            </button>
          </form>
          {msg && (
            <p role="status" className={`text-[13px] ${msg.ok ? "" : "text-[var(--red)]"}`}>
              {msg.text}
            </p>
          )}
        </div>
      )}
    </Async>
  );
}
