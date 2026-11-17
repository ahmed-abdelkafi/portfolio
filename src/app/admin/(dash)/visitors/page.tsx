"use client";

import { useApi } from "../../_lib/api";
import { dec, duration, num, pct } from "../../_lib/format";
import { daysBetween, useRange } from "../../_lib/range";
import type { VisitorsReport } from "../../_lib/types";
import { LineChart } from "../../_components/charts";
import { Async, BarList, Empty, Kpi, Panel } from "../../_components/ui";

export default function VisitorsPage() {
  const r = useRange();
  const rep = useApi<VisitorsReport>(`/api/admin/visitors?${r.query}`);
  const days = daysBetween(r.from, r.to);

  return (
    <Async state={rep} h={320} isEmpty={(d) => d.current.sessions === 0} empty={<Panel title="Visitors"><Empty title="No visitors in this period" /></Panel>}>
      {(d) => {
        const by = new Map(d.series.map((s) => [s.day, s]));
        const c = d.current;
        const p = d.previous;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Kpi accent label="Unique visitors" value={num(c.visitors)} cur={c.visitors} prev={p.visitors} hint="Unique per day, summed over the range." />
              <Kpi label="New visitors" value={num(c.newVisitors)} cur={c.newVisitors} prev={p.newVisitors} />
              <Kpi label="Returning visitors" value={num(c.returningVisitors)} cur={c.returningVisitors} prev={p.returningVisitors} />
              <Kpi label="Returning share" value={pct(c.visitors ? c.returningVisitors / c.visitors : 0, 0)} cur={c.visitors ? c.returningVisitors / c.visitors : 0} prev={p.visitors ? p.returningVisitors / p.visitors : 0} />
              <Kpi label="Sessions" value={num(c.sessions)} cur={c.sessions} prev={p.sessions} />
              <Kpi label="Sessions per visitor" value={dec(c.visitors ? c.sessions / c.visitors : 0)} cur={c.visitors ? c.sessions / c.visitors : 0} prev={p.visitors ? p.sessions / p.visitors : 0} />
              <Kpi label="Pages per session" value={dec(c.pagesPerSession)} cur={c.pagesPerSession} prev={p.pagesPerSession} />
              <Kpi label="Avg. engagement / session" value={duration(c.avgEngagementMs)} cur={c.avgEngagementMs} prev={p.avgEngagementMs} />
            </div>

            <Panel title="New and returning visitors" note="Per day">
              <LineChart
                labels={days}
                series={[
                  { name: "New visitors", values: days.map((x) => by.get(x)?.new_visitors ?? 0), tone: "red" },
                  { name: "Returning visitors", values: days.map((x) => by.get(x)?.returning_visitors ?? 0), tone: "ink" },
                ]}
              />
            </Panel>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Sessions and page views" note="Per day">
                <LineChart
                  height={220}
                  labels={days}
                  series={[
                    { name: "Page views", values: days.map((x) => by.get(x)?.pageviews ?? 0), tone: "red" },
                    { name: "Sessions", values: days.map((x) => by.get(x)?.sessions ?? 0), tone: "ink" },
                  ]}
                />
              </Panel>
              <Panel title="Session depth" note="Pages viewed per session">
                <BarList
                  valueLabel="Sessions"
                  format={num}
                  highlightFirst={false}
                  rows={["1", "2", "3", "4", "5+"].map((b) => ({ key: b, label: `${b} page${b === "1" ? "" : "s"}`, value: d.depth.find((x) => x.bucket === b)?.sessions ?? 0 }))}
                />
                <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--muted)]">
                  How visitors are counted: there are no cookies, so a visitor is an anonymous code that changes every day. Someone visiting on three different days counts as three visitors; &ldquo;returning&rdquo; comes from a non-identifying flag the browser keeps.
                </p>
              </Panel>
            </div>
          </div>
        );
      }}
    </Async>
  );
}
