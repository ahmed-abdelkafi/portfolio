"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import world from "../_lib/world.json";
import { countryName, flag, num, pct } from "../_lib/format";
import { Legend } from "./ui";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const niceMax = (v: number) => {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};

const shortDay = (d: string) => {
  const [, m, day] = d.split("-");
  return `${Number(day)} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]}`;
};

export type Series = { name: string; values: number[]; tone: "red" | "ink" | "muted"; dashed?: boolean; area?: boolean };
const TONE = { red: "var(--red)", ink: "var(--ink)", muted: "var(--muted)" };

/**
 * Line chart: 2px lines, one y-axis, recessive grid, crosshair + tooltip on hover.
 * `labels` are local days (YYYY-MM-DD) or preformatted strings.
 */
export function LineChart({
  labels,
  series,
  height = 260,
  format = num,
  labelFormat = shortDay,
  tooltipLabels,
}: {
  labels: string[];
  series: Series[];
  height?: number;
  format?: (n: number) => string;
  labelFormat?: (s: string) => string;
  /** Optional per-series label for the tooltip row (e.g. the matching previous-period date). */
  tooltipLabels?: (i: number) => Record<string, string>;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 44, r: 12, t: 12, b: 28 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = labels.length;
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 72))));

  const paths = series.map((s) => {
    const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    return { s, line: `M${pts.join("L")}`, area: `M${x(0)},${y(0)}L${pts.join("L")}L${x(n - 1)},${y(0)}Z` };
  });

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = n <= 1 ? 0 : Math.round(((px - pad.l) / iw) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const extra = hover !== null ? tooltipLabels?.(hover) : undefined;

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3">
          <Legend
            items={series.map((s) => ({
              label: s.name,
              swatch: (
                <svg width="22" height="8" aria-hidden>
                  <line x1="0" y1="4" x2="22" y2="4" stroke={TONE[s.tone]} strokeWidth="2" strokeDasharray={s.dashed ? "4 3" : undefined} />
                </svg>
              ),
            }))}
          />
        </div>
      )}
      <div ref={ref} className="relative">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${series.map((s) => s.name).join(" and ")}, ${n} points`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          className="block touch-none"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="mono" fontSize="10.5" fill="var(--muted)">
                {format(t)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % every === 0 || i === n - 1 ? (
              <text key={l + i} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="mono" fontSize="10.5" fill="var(--muted)">
                {labelFormat(l)}
              </text>
            ) : null,
          )}
          {paths.map(({ s, area }) => (s.area ? <path key={`a-${s.name}`} d={area} fill="color-mix(in oklab, var(--red) 9%, transparent)" /> : null))}
          {paths.map(({ s, line }) => (
            <path
              key={s.name}
              d={line}
              fill="none"
              stroke={TONE[s.tone]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? "5 4" : undefined}
              opacity={s.dashed ? 0.7 : 1}
            />
          ))}
          {n === 1 && series.map((s) => <circle key={`d-${s.name}`} cx={x(0)} cy={y(s.values[0] ?? 0)} r={4} fill={TONE[s.tone]} />)}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--ink)" strokeOpacity="0.35" />
              {series.map((s) => (
                <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4.5} fill={TONE[s.tone]} stroke="var(--bone)" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-sm bg-[var(--ink)] px-3 py-2 text-[var(--bone)] shadow-lg"
            style={{ left: Math.min(Math.max(x(hover) + 12, 0), width - 170) }}
          >
            <p className="label !text-[var(--muted-dark)]">{labelFormat(labels[hover])}</p>
            {series.map((s) => (
              <p key={s.name} className="mt-1 flex items-center justify-between gap-4 text-[12.5px]">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-[2px] w-3" style={{ background: s.tone === "ink" ? "var(--bone)" : TONE[s.tone] }} />
                  {extra?.[s.name] ?? s.name}
                </span>
                <span className="mono">{format(s.values[hover] ?? 0)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Vertical bars (e.g. page views per minute). Single hue; hover shows the value. */
export function Columns({ points, height = 120, label }: { points: { key: string; label: string; value: number }[]; height?: number; label: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...points.map((p) => p.value)));
  const n = Math.max(1, points.length);
  const gap = 2;
  const bw = Math.max(2, (width - gap * (n - 1)) / n);
  return (
    <div ref={ref} className="relative">
      <svg width={width} height={height} role="img" aria-label={label} className="block" onPointerLeave={() => setHover(null)}>
        <line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke="var(--line-strong)" />
        {points.map((p, i) => {
          const h = (p.value / max) * (height - 8);
          return (
            <g key={p.key} onPointerEnter={() => setHover(i)}>
              <rect x={i * (bw + gap)} y={0} width={bw} height={height} fill="transparent" />
              <rect x={i * (bw + gap)} y={height - h} width={bw} height={Math.max(h, p.value ? 2 : 0)} rx={Math.min(4, bw / 2)} fill={hover === i ? "var(--red)" : "var(--ink)"} opacity={hover === null || hover === i ? 1 : 0.55} />
            </g>
          );
        })}
      </svg>
      {hover !== null && points[hover] && (
        <div className="pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-sm bg-[var(--ink)] px-2.5 py-1.5 text-[12px] text-[var(--bone)]" style={{ left: Math.min(hover * (bw + gap), width - 130) }}>
          <span className="mono">{points[hover].label}</span> · {num(points[hover].value)}
        </div>
      )}
    </div>
  );
}

/** Donut for a small part-to-whole (≤ 4 slices), always with legend + direct percentages. */
export function Donut({ slices, size = 180, centerLabel }: { slices: { key: string; label: string; value: number }[]; size?: number; centerLabel: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const tones = ["var(--red)", "var(--ink)", "var(--muted)", "var(--bone-3)"];
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = size / 2 - 6;
  const stroke = 22;
  const c = 2 * Math.PI * (r - stroke / 2);
  const lens = slices.map((s) => (s.value / total) * c);
  const arcs = slices.map((s, i) => {
    const len = lens[i];
    const start = lens.slice(0, i).reduce((a, l) => a + l, 0);
    const gap = slices.length > 1 ? Math.min(3, len / 3) : 0;
    return { ...s, tone: tones[i] ?? "var(--muted)", dash: `${Math.max(0, len - gap)} ${c - Math.max(0, len - gap)}`, offset: -start };
  });
  const focus = arcs.find((a) => a.key === hover);
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${centerLabel}: ${slices.map((s) => `${s.label} ${pct(s.value / total, 0)}`).join(", ")}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={r - stroke / 2}
              fill="none"
              stroke={a.tone}
              strokeWidth={hover === a.key ? stroke + 4 : stroke}
              strokeDasharray={a.dash}
              strokeDashoffset={a.offset}
              opacity={hover && hover !== a.key ? 0.45 : 1}
              onPointerEnter={() => setHover(a.key)}
              onPointerLeave={() => setHover(null)}
              style={{ transition: "stroke-width .25s, opacity .25s" }}
            />
          ))}
        </g>
        <text x="50%" y="46%" textAnchor="middle" className="num" fontSize="30" fill="var(--ink)">
          {focus ? pct(focus.value / total, 0) : num(total)}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="mono" fontSize="10" letterSpacing="1.4" fill="var(--muted)">
          {(focus ? focus.label : centerLabel).toUpperCase()}
        </text>
      </svg>
      <ul className="min-w-[160px] flex-1 space-y-2">
        {arcs.map((a) => (
          <li key={a.key} className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-2 text-[13.5px]" onPointerEnter={() => setHover(a.key)} onPointerLeave={() => setHover(null)}>
            <span className="flex items-center gap-2.5">
              <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: a.tone, outline: a.tone === "var(--bone-3)" ? "1px solid var(--line-strong)" : undefined }} />
              {a.label}
            </span>
            <span className="mono text-[12.5px]">
              {num(a.value)} <span className="text-[var(--muted)]">· {pct(a.value / total, 0)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Choropleth world map (sequential: bone → red), approximate country only. */
export function WorldMap({ values, metric = "Visitors" }: { values: Record<string, number>; metric?: string }) {
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const max = Math.max(1, ...Object.values(values));
  const fill = (id: string) => {
    const v = values[id] ?? 0;
    if (!v) return "var(--bone-2)";
    const t = Math.sqrt(v / max); // perceptual spread for skewed counts
    return `color-mix(in oklab, var(--red) ${Math.round(18 + t * 82)}%, var(--bone))`;
  };
  const shapes = useMemo(() => world.shapes, []);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${world.width} ${world.height}`} className="block h-auto w-full" role="img" aria-label={`${metric} by country`} onPointerLeave={() => setHover(null)}>
        <path d={world.sphere} fill="color-mix(in oklab, var(--bone) 60%, var(--bone-2))" stroke="var(--line)" />
        {shapes.map((s) => (
          <path
            key={s.id + s.name}
            d={s.d}
            fill={fill(s.id)}
            stroke={hover?.id === s.id ? "var(--ink)" : "var(--bone)"}
            strokeWidth={hover?.id === s.id ? 1.2 : 0.5}
            onPointerMove={(e) => {
              const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              setHover({ id: s.id, x: e.clientX - box.left, y: e.clientY - box.top });
            }}
            style={{ transition: "fill .4s" }}
          />
        ))}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute z-10 rounded-sm bg-[var(--ink)] px-3 py-2 text-[12.5px] text-[var(--bone)]" style={{ left: hover.x + 14, top: hover.y + 10 }}>
          {flag(hover.id)} {countryName(hover.id)} · <span className="mono">{num(values[hover.id] ?? 0)}</span> {metric.toLowerCase()}
        </div>
      )}
      <div className="mt-3 flex items-center gap-3">
        <span className="label">0</span>
        <span className="h-2 w-40 rounded-full" style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--red) 18%, var(--bone)), var(--red))" }} />
        <span className="label">{num(max)}</span>
        <span className="label ml-2">{metric} per country · approximate location only</span>
      </div>
    </div>
  );
}
