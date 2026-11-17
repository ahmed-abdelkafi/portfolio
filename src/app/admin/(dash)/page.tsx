"use client";

import Link from "next/link";
import { useApi } from "../_lib/api";
import { countryName, DEVICE_LABELS, duration, flag, num, pageLabel, pct } from "../_lib/format";
import { daysBetween, useRange } from "../_lib/range";
import type { DevicesReport, GeoReport, Overview, PagesReport, SourcesReport } from "../_lib/types";
import { Donut, LineChart } from "../_components/charts";
import { Async, BarList, Empty, Kpi, Loading, ErrorBox, Panel } from "../_components/ui";

export default function OverviewPage() {
  const r = useRange();
  const ov = useApi<Overview>(`/api/admin/overview?${r.query}`);
  const src = useApi<SourcesReport>(`/api/admin/sources?${r.query}`);
  const geo = useApi<GeoReport>(`/api/admin/geography?${r.query}`);
  const dev = useApi<DevicesReport>(`/api/admin/devices?${r.query}`);
  const pg = useApi<PagesReport>(`/api/admin/pages?${r.query}`);

  const days = daysBetween(r.from, r.to);

  return (
    <div className="space-y-6">
      {ov.error ? (
        <ErrorBox message={ov.error} onRetry={ov.reload} />
      ) : !ov.data ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Loading key={i} h={128} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi accent label="Unique visitors" value={num(ov.data.current.visitors)} cur={ov.data.current.visitors} prev={ov.data.previous.visitors} hint="Unique visitors per day, summed over the range (cookie-free identity resets daily)." />
          <Kpi label="Sessions" value={num(ov.data.current.sessions)} cur={ov.data.current.sessions} prev={ov.data.previous.sessions} hint="A session ends after 30 minutes of inactivity." />
          <Kpi label="Page views" value={num(ov.data.current.pageviews)} cur={ov.data.current.pageviews} prev={ov.data.previous.pageviews} />
          <Kpi label="Avg. engagement / session" value={duration(ov.data.current.avgEngagementMs)} cur={ov.data.current.avgEngagementMs} prev={ov.data.previous.avgEngagementMs} hint="Time the page was visible in the foreground." />
          <Kpi label="Engagement rate" value={pct(ov.data.current.engagementRate, 0)} cur={ov.data.current.engagementRate} prev={ov.data.previous.engagementRate} hint="Sessions with 10 s+ of engagement, 2+ pages or an interaction." />
          <Kpi label="Bounce rate" value={pct(ov.data.current.bounceRate, 0)} cur={ov.data.current.bounceRate} prev={ov.data.previous.bounceRate} invert hint="Sessions that were not engaged." />
          <Kpi label="New visitors" value={num(ov.data.current.newVisitors)} cur={ov.data.current.newVisitors} prev={ov.data.previous.newVisitors} hint="Browsers visiting for the first time." />
          <Kpi label="Returning visitors" value={num(ov.data.current.returningVisitors)} cur={ov.data.current.returningVisitors} prev={ov.data.previous.returningVisitors} hint="Browsers that had visited before." />
        </div>
      )}

      <Panel title="Visitors over time" note={`${r.label} vs. previous period`}>
        <Async state={ov} h={260} isEmpty={(d) => d.current.pageviews === 0 && d.previous.pageviews === 0} empty={<Empty title="No visits recorded yet">Visits appear here as soon as someone opens the portfolio. Your own visits are never counted while you are signed in.</Empty>}>
          {(d) => {
            const byDay = new Map(d.series.map((s) => [s.day, s.visitors]));
            const prevDays = daysBetween(r.from - (r.to - r.from), r.from);
            const prevByDay = new Map(d.prevSeries.map((s) => [s.day, s.visitors]));
            return (
              <LineChart
                labels={days}
                series={[
                  { name: "This period", values: days.map((day) => byDay.get(day) ?? 0), tone: "red", area: true },
                  { name: "Previous period", values: prevDays.slice(0, days.length).map((day) => prevByDay.get(day) ?? 0), tone: "ink", dashed: true },
                ]}
                tooltipLabels={(i) => ({ "Previous period": prevDays[i] ?? "Previous period" })}
              />
            );
          }}
        </Async>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Top traffic sources" action={<Link href="/admin/sources" className="label hover:text-[var(--ink)]">All sources →</Link>}>
          <Async state={src} isEmpty={(d) => d.rows.length === 0}>
            {(d) => {
              const agg = new Map<string, number>();
              for (const row of d.rows) agg.set(row.source, (agg.get(row.source) ?? 0) + row.sessions);
              return <BarList valueLabel="Sessions" format={num} rows={[...agg].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ key: k, label: k, value: v }))} />;
            }}
          </Async>
        </Panel>
        <Panel title="Top countries" action={<Link href="/admin/geography" className="label hover:text-[var(--ink)]">Map →</Link>}>
          <Async state={geo} isEmpty={(d) => d.countries.length === 0}>
            {(d) => (
              <BarList
                format={num}
                rows={d.countries.slice(0, 6).map((c) => ({ key: c.country, label: `${flag(c.country)}  ${countryName(c.country)}`, value: c.visitors }))}
              />
            )}
          </Async>
        </Panel>
        <Panel title="Devices" action={<Link href="/admin/devices" className="label hover:text-[var(--ink)]">Details →</Link>}>
          <Async state={dev} isEmpty={(d) => d.device.length === 0}>
            {(d) => <Donut centerLabel="Visitors" slices={d.device.slice(0, 4).map((x) => ({ key: x.name, label: DEVICE_LABELS[x.name] ?? x.name, value: x.visitors }))} />}
          </Async>
        </Panel>
        <Panel title="Most visited pages" action={<Link href="/admin/pages" className="label hover:text-[var(--ink)]">All pages →</Link>}>
          <Async state={pg} isEmpty={(d) => d.top.length === 0}>
            {(d) => <BarList valueLabel="Page views" format={num} rows={d.top.slice(0, 6).map((p) => ({ key: p.path, label: pageLabel(p.path), value: p.pageviews }))} />}
          </Async>
        </Panel>
      </div>
    </div>
  );
}
