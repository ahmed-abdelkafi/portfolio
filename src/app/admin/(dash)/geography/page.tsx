"use client";

import { useMemo, useState } from "react";
import { useApi } from "../../_lib/api";
import { countryName, flag, num } from "../../_lib/format";
import { daysBetween, useRange } from "../../_lib/range";
import type { GeoReport } from "../../_lib/types";
import { LineChart, WorldMap } from "../../_components/charts";
import { Async, BarList, DataTable, Delta, Empty, Panel } from "../../_components/ui";

export default function GeographyPage() {
  const r = useRange();
  const rep = useApi<GeoReport>(`/api/admin/geography?${r.query}`);
  const [country, setCountry] = useState<string | null>(null);
  const days = daysBetween(r.from, r.to);

  return (
    <Async state={rep} h={420} isEmpty={(d) => d.countries.length === 0} empty={<Panel title="Geography"><Empty title="No visits in this period" /></Panel>}>
      {(d) => <Geo d={d} days={days} country={country} setCountry={setCountry} />}
    </Async>
  );
}

function Geo({ d, days, country, setCountry }: { d: GeoReport; days: string[]; country: string | null; setCountry: (c: string | null) => void }) {
  const values = useMemo(() => Object.fromEntries(d.countries.map((c) => [c.country, c.visitors])), [d]);
  const prev = useMemo(() => new Map(d.previous.map((c) => [c.country, c.visitors])), [d]);
  const top = d.countries.slice(0, 3).map((c) => c.country);
  const trendBy = (code: string) => {
    const m = new Map(d.trend.filter((t) => t.country === code).map((t) => [t.day, t.visitors]));
    return days.map((x) => m.get(x) ?? 0);
  };
  const selected = country ?? d.countries[0]?.country ?? null;
  const regions = d.regions.filter((x) => x.country === selected);
  const total = d.countries.reduce((a, c) => a + c.visitors, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Visitor distribution" note={`${d.countries.length} countries · ${num(total)} visitors`}>
          <WorldMap values={values} />
        </Panel>
        <Panel title="Country ranking">
          <ol className="space-y-1">
            {d.countries.slice(0, 10).map((c, i) => (
              <li key={c.country}>
                <button
                  type="button"
                  onClick={() => setCountry(c.country)}
                  className={`flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left text-[13.5px] transition-colors hover:bg-[var(--bone-2)] ${selected === c.country ? "bg-[var(--bone-2)]" : ""}`}
                  aria-pressed={selected === c.country}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="mono w-5 text-[11px] text-[var(--muted)]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">
                      {flag(c.country)} {countryName(c.country)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Delta cur={c.visitors} prev={prev.get(c.country) ?? 0} />
                    <span className="mono text-[12.5px]">{num(c.visitors)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="label mt-4">Select a country to see its regions</p>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={`Regions · ${countryName(selected)}`} note="Approximate, from Cloudflare">
          {regions.length ? <BarList format={num} rows={regions.slice(0, 12).map((x) => ({ key: x.region, label: x.region, value: x.visitors }))} /> : <Empty title="No region data" />}
        </Panel>
        <Panel title="Top countries over time" note="Visitors per day">
          {top.length ? (
            <LineChart
              height={240}
              labels={days}
              series={top.map((code, i) => ({ name: countryName(code), values: trendBy(code), tone: (["red", "ink", "muted"] as const)[i] }))}
            />
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      <Panel title="All countries">
        <DataTable
          caption="Visitors by country"
          rows={d.countries}
          initialSort="visitors"
          cols={[
            { key: "country", label: "Country", render: (x) => `${flag(x.country)}  ${countryName(x.country)}`, sort: (x) => countryName(x.country) },
            { key: "visitors", label: "Visitors", right: true, render: (x) => num(x.visitors), sort: (x) => x.visitors },
            { key: "sessions", label: "Sessions", right: true, render: (x) => num(x.sessions), sort: (x) => x.sessions },
            { key: "pageviews", label: "Page views", right: true, render: (x) => num(x.pageviews), sort: (x) => x.pageviews },
            { key: "delta", label: "vs. previous", right: true, render: (x) => <Delta cur={x.visitors} prev={prev.get(x.country) ?? 0} /> },
          ]}
        />
      </Panel>
    </div>
  );
}
