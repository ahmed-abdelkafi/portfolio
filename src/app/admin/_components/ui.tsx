"use client";

import { useMemo, useState } from "react";
import { delta, pct } from "../_lib/format";

export function Panel({
  title,
  note,
  children,
  className = "",
  action,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <h2 className="panel-title">{title}</h2>
        {action ?? (note && <span className="label text-right">{note}</span>)}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Skeleton({ h = 180 }: { h?: number }) {
  return <div className="skeleton w-full" style={{ height: h }} aria-hidden />;
}

export function Loading({ h = 180, label = "Loading data" }: { h?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}…</span>
      <Skeleton h={h} />
    </div>
  );
}

export function Empty({ title = "No data yet", children }: { title?: string; children?: React.ReactNode }) {
  return (
    <div className="grid min-h-[140px] place-items-center px-4 py-8 text-center">
      <div>
        <p className="serif text-2xl">{title}</p>
        {children && <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">{children}</p>}
      </div>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-[var(--red)] bg-[var(--red-soft)] px-4 py-3 text-sm">
      <span>
        <strong className="font-semibold">Could not load this report.</strong> {message}
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="chip">
          Retry
        </button>
      )}
    </div>
  );
}

/** Renders loading / error / empty / content for an async report. */
export function Async<T>({
  state,
  isEmpty,
  empty,
  h,
  children,
}: {
  state: { data: T | null; error: string | null; loading: boolean; reload: () => void };
  isEmpty?: (d: T) => boolean;
  empty?: React.ReactNode;
  h?: number;
  children: (d: T) => React.ReactNode;
}) {
  if (state.error) return <ErrorBox message={state.error} onRetry={state.reload} />;
  if (state.loading && !state.data) return <Loading h={h} />;
  if (!state.data) return null;
  if (isEmpty?.(state.data)) return <>{empty ?? <Empty />}</>;
  return <>{children(state.data)}</>;
}

export function Delta({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  const d = delta(cur, prev);
  if (d === null) return <span className="label">new</span>;
  if (d === 0) return <span className="label">— 0%</span>;
  const good = invert ? d < 0 : d > 0;
  return (
    <span className={`mono text-[11.5px] ${good ? "text-[var(--ink)]" : "text-[var(--red)]"}`} title="Change vs. previous period">
      {d > 0 ? "▲" : "▼"} {pct(Math.abs(d), Math.abs(d) < 0.1 ? 1 : 0)}
    </span>
  );
}

export function Kpi({
  label,
  value,
  cur,
  prev,
  invert,
  hint,
  accent,
}: {
  label: string;
  value: string;
  cur?: number;
  prev?: number;
  invert?: boolean;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={`panel flex flex-col justify-between gap-4 p-4 md:gap-6 md:p-5 ${accent ? "!border-[var(--ink)] !bg-[var(--ink)] !text-[var(--bone)]" : ""}`} title={hint}>
      <p className={`label ${accent ? "!text-[var(--muted-dark)]" : ""}`}>{label}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="num text-[clamp(30px,3.6vw,56px)]">{value}</p>
        {cur !== undefined && prev !== undefined && (
          <span className={accent ? "[&_*]:!text-[var(--bone)]" : ""}>
            <Delta cur={cur} prev={prev} invert={invert} />
          </span>
        )}
      </div>
    </div>
  );
}

/** Horizontal bar list: single-hue magnitude with direct labels and a hover readout. */
export function BarList({
  rows,
  valueLabel = "Visitors",
  format = (n: number) => String(n),
  max: maxProp,
  highlightFirst = true,
}: {
  rows: { key: string; label: React.ReactNode; value: number; extra?: React.ReactNode }[];
  valueLabel?: string;
  format?: (n: number) => string;
  max?: number;
  highlightFirst?: boolean;
}) {
  const max = maxProp ?? Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <ul className="space-y-1.5" aria-label={valueLabel}>
      {rows.map((r, i) => (
        <li key={r.key} className="group relative" title={`${valueLabel}: ${format(r.value)} (${pct(r.value / total)})`}>
          <div className="absolute inset-y-0 left-0 rounded-r-[4px] transition-[width] duration-700" style={{ width: `${(r.value / max) * 100}%`, background: i === 0 && highlightFirst ? "color-mix(in oklab, var(--red) 16%, var(--bone))" : "var(--bone-2)", transitionTimingFunction: "var(--ease)" }} />
          <div className="relative flex items-center justify-between gap-3 px-2.5 py-2 text-[13.5px]">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="flex shrink-0 items-center gap-3">
              {r.extra}
              <span className="mono text-[12.5px]">{format(r.value)}</span>
              <span className="mono w-12 text-right text-[11px] text-[var(--muted)]">{pct(r.value / total, 0)}</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

type Col<T> = { key: string; label: string; right?: boolean; render: (row: T) => React.ReactNode; sort?: (row: T) => number | string };

/** Sortable table with an optional row cap and "show all". */
export function DataTable<T>({ rows, cols, initialSort, cap = 12, caption }: { rows: T[]; cols: Col<T>[]; initialSort?: string; cap?: number; caption?: string }) {
  const [sortKey, setSortKey] = useState(initialSort ?? cols.find((c) => c.sort)?.key);
  const [desc, setDesc] = useState(true);
  const [all, setAll] = useState(false);
  const sorted = useMemo(() => {
    const col = cols.find((c) => c.key === sortKey);
    if (!col?.sort) return rows;
    return [...rows].sort((a, b) => {
      const x = col.sort!(a);
      const y = col.sort!(b);
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return desc ? -c : c;
    });
  }, [rows, cols, sortKey, desc]);
  const shown = all ? sorted : sorted.slice(0, cap);
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} className={c.right ? "r" : ""} aria-sort={sortKey === c.key ? (desc ? "descending" : "ascending") : undefined}>
                {c.sort ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (sortKey === c.key) setDesc(!desc);
                      else {
                        setSortKey(c.key);
                        setDesc(true);
                      }
                    }}
                    className="hover:text-[var(--ink)]"
                  >
                    {c.label} {sortKey === c.key ? (desc ? "↓" : "↑") : ""}
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c.key} className={c.right ? "r" : ""}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > cap && (
        <button type="button" className="label mt-3 hover:text-[var(--ink)]" onClick={() => setAll(!all)}>
          {all ? "Show less" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; swatch: React.ReactNode }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
          {it.swatch}
          {it.label}
        </li>
      ))}
    </ul>
  );
}
