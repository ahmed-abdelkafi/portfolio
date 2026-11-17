"use client";

import { useApi } from "../../_lib/api";
import { duration, num, pct } from "../../_lib/format";
import { useRange } from "../../_lib/range";
import type { SourcesReport } from "../../_lib/types";
import { Async, BarList, DataTable, Delta, Empty, Panel } from "../../_components/ui";

const MEDIUM_LABEL: Record<string, string> = { organic: "Search engines", social: "Social networks", referral: "Referral websites", none: "Direct", campaign: "Campaigns" };

export default function SourcesPage() {
  const r = useRange();
  const rep = useApi<SourcesReport>(`/api/admin/sources?${r.query}`);

  return (
    <Async state={rep} h={320} isEmpty={(d) => d.rows.length === 0} empty={<Panel title="Traffic sources"><Empty title="No traffic in this period" /></Panel>}>
      {(d) => {
        const sum = (rows: SourcesReport["rows"], f: (x: SourcesReport["rows"][number]) => string) => {
          const m = new Map<string, { sessions: number; visitors: number; engaged: number }>();
          for (const x of rows) {
            const k = f(x);
            const v = m.get(k) ?? { sessions: 0, visitors: 0, engaged: 0 };
            v.sessions += x.sessions;
            v.visitors += x.visitors;
            v.engaged += x.engaged;
            m.set(k, v);
          }
          return m;
        };
        const bySource = sum(d.rows, (x) => x.source);
        const prevBySource = sum(d.previous, (x) => x.source);
        const byMedium = sum(d.rows, (x) => MEDIUM_LABEL[x.medium] ?? x.medium);
        const highlights = ["Google", "LinkedIn", "GitHub", "Direct"];
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {highlights.map((h, i) => {
                const cur = bySource.get(h)?.sessions ?? 0;
                const prev = prevBySource.get(h)?.sessions ?? 0;
                return (
                  <div key={h} className={`panel p-5 ${i === 0 ? "!border-[var(--ink)] !bg-[var(--ink)] text-[var(--bone)]" : ""}`}>
                    <p className={`label ${i === 0 ? "!text-[var(--muted-dark)]" : ""}`}>{h === "Google" ? "Google Search" : h}</p>
                    <div className="mt-6 flex items-end justify-between">
                      <p className="num text-5xl">{num(cur)}</p>
                      <span className={i === 0 ? "[&_*]:!text-[var(--bone)]" : ""}>
                        <Delta cur={cur} prev={prev} />
                      </span>
                    </div>
                    <p className={`label mt-2 ${i === 0 ? "!text-[var(--muted-dark)]" : ""}`}>sessions</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <Panel title="Sessions by source">
                <BarList valueLabel="Sessions" format={num} rows={[...bySource].sort((a, b) => b[1].sessions - a[1].sessions).slice(0, 12).map(([k, v]) => ({ key: k, label: k, value: v.sessions }))} />
              </Panel>
              <Panel title="Sessions by channel">
                <BarList valueLabel="Sessions" format={num} rows={[...byMedium].sort((a, b) => b[1].sessions - a[1].sessions).map(([k, v]) => ({ key: k, label: k, value: v.sessions }))} />
                <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--muted)]">
                  Channels come from the referring site, or from <span className="mono">utm_source / utm_medium / utm_campaign</span> tags when a link carries them (e.g. the link in your CV or LinkedIn profile).
                </p>
              </Panel>
            </div>

            <Panel title="Source / medium / campaign" note="First page of each session">
              <DataTable
                caption="Traffic sources"
                rows={d.rows}
                initialSort="sessions"
                cols={[
                  { key: "source", label: "Source", render: (x) => <span className="font-medium">{x.source}</span>, sort: (x) => x.source },
                  { key: "medium", label: "Medium", render: (x) => x.medium, sort: (x) => x.medium },
                  { key: "campaign", label: "Campaign", render: (x) => x.campaign || <span className="text-[var(--muted)]">—</span> },
                  { key: "visitors", label: "Visitors", right: true, render: (x) => num(x.visitors), sort: (x) => x.visitors },
                  { key: "sessions", label: "Sessions", right: true, render: (x) => num(x.sessions), sort: (x) => x.sessions },
                  { key: "eng", label: "Engaged", right: true, render: (x) => pct(x.sessions ? x.engaged / x.sessions : 0, 0), sort: (x) => (x.sessions ? x.engaged / x.sessions : 0) },
                  { key: "time", label: "Avg. time", right: true, render: (x) => duration(x.avg_engagement_ms), sort: (x) => x.avg_engagement_ms },
                ]}
              />
            </Panel>
          </div>
        );
      }}
    </Async>
  );
}
