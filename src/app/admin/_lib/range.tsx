"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Preset = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";
export const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "custom", label: "Custom" },
];

type RangeState = {
  preset: Preset;
  customFrom: string; // YYYY-MM-DD (local)
  customTo: string;
};

type RangeValue = RangeState & {
  from: number;
  to: number;
  tz: number;
  label: string;
  /** Query string for the admin API: from, to, tz. */
  query: string;
  setPreset: (p: Preset) => void;
  setCustom: (from: string, to: string) => void;
};

const Ctx = createContext<RangeValue | null>(null);
const KEY = "aa-admin-range";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

function compute(s: RangeState, now = new Date()) {
  const today = startOfDay(now);
  const day = 86_400_000;
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  switch (s.preset) {
    case "today":
      return { from: today.getTime(), to: addDays(today, 1).getTime(), label: "Today" };
    case "yesterday":
      return { from: addDays(today, -1).getTime(), to: today.getTime(), label: "Yesterday" };
    case "7d":
      return { from: addDays(today, -6).getTime(), to: addDays(today, 1).getTime(), label: "Last 7 days" };
    case "30d":
      return { from: addDays(today, -29).getTime(), to: addDays(today, 1).getTime(), label: "Last 30 days" };
    case "90d":
      return { from: addDays(today, -89).getTime(), to: addDays(today, 1).getTime(), label: "Last 90 days" };
    case "custom": {
      const f = parseYmd(s.customFrom);
      const t = addDays(parseYmd(s.customTo), 1);
      const ok = t.getTime() > f.getTime() && t.getTime() - f.getTime() <= 400 * day;
      return ok
        ? { from: f.getTime(), to: t.getTime(), label: `${s.customFrom} → ${s.customTo}` }
        : { from: addDays(today, -29).getTime(), to: addDays(today, 1).getTime(), label: "Last 30 days" };
    }
  }
}

export function RangeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RangeState>(() => {
    const t = new Date();
    return { preset: "30d", customFrom: ymd(new Date(t.getTime() - 29 * 86_400_000)), customTo: ymd(t) };
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as RangeState | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore a per-device preference after hydration
      if (saved?.preset) setState(saved);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const value = useMemo<RangeValue>(() => {
    const r = compute(state);
    const tz = -new Date().getTimezoneOffset();
    return {
      ...state,
      ...r,
      tz,
      query: `from=${r.from}&to=${r.to}&tz=${tz}`,
      setPreset: (preset) => setState((s) => ({ ...s, preset })),
      setCustom: (customFrom, customTo) => setState({ preset: "custom", customFrom, customTo }),
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRange() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRange outside RangeProvider");
  return v;
}

/** Every local calendar day in [from, to), as YYYY-MM-DD, to fill gaps in daily series. */
export function daysBetween(from: number, to: number) {
  const out: string[] = [];
  for (let d = new Date(from); d.getTime() < to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) out.push(ymd(d));
  return out;
}
