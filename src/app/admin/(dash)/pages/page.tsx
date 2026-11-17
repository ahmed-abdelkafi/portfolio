"use client";

import { useApi } from "../../_lib/api";
import { duration, num, pageLabel, projectName } from "../../_lib/format";
import { useRange } from "../../_lib/range";
import type { PagesReport } from "../../_lib/types";
import { Async, BarList, DataTable, Empty, Panel } from "../../_components/ui";

export default function PagesPage() {
  const r = useRange();
  const rep = useApi<PagesReport>(`/api/admin/pages?${r.query}`);

  return (
    <Async state={rep} h={320} isEmpty={(d) => d.top.length === 0} empty={<Panel title="Pages"><Empty title="No page views in this period" /></Panel>}>
      {(d) => {
        const clicks = new Map(d.projectClicks.map((c) => [c.slug, c]));
        const slugs = [...new Set([...d.projects.map((p) => p.slug), ...d.projectClicks.map((c) => c.slug)])];
        const projects = slugs.map((slug) => {
          const v = d.projects.find((p) => p.slug === slug);
          return { slug, views: v?.views ?? 0, visitors: v?.visitors ?? 0, avg: v?.avg_engagement_ms ?? 0, clicks: clicks.get(slug)?.clicks ?? 0 };
        });
        return (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Most popular projects" note="Case study views">
                {projects.length ? (
                  <BarList format={num} valueLabel="Case study views" rows={[...projects].sort((a, b) => b.views - a.views).map((p) => ({ key: p.slug, label: projectName(p.slug), value: p.views }))} />
                ) : (
                  <Empty title="No case study opened yet" />
                )}
              </Panel>
              <Panel title="Project clicks" note="From the portfolio's lists and gallery">
                {d.projectClicks.length ? (
                  <BarList format={num} valueLabel="Clicks" rows={d.projectClicks.map((p) => ({ key: p.slug, label: projectName(p.slug), value: p.clicks }))} />
                ) : (
                  <Empty title="No project clicks yet" />
                )}
              </Panel>
            </div>

            <Panel title="Case studies" note="Views, readers and time spent">
              <DataTable
                caption="Case studies"
                rows={projects}
                initialSort="views"
                cols={[
                  { key: "p", label: "Project", render: (x) => <span className="font-medium">{projectName(x.slug)}</span>, sort: (x) => projectName(x.slug) },
                  { key: "views", label: "Views", right: true, render: (x) => num(x.views), sort: (x) => x.views },
                  { key: "visitors", label: "Readers", right: true, render: (x) => num(x.visitors), sort: (x) => x.visitors },
                  { key: "clicks", label: "Clicks to it", right: true, render: (x) => num(x.clicks), sort: (x) => x.clicks },
                  { key: "avg", label: "Avg. time on page", right: true, render: (x) => duration(x.avg), sort: (x) => x.avg },
                ]}
              />
            </Panel>

            <Panel title="All pages" note="Engagement = visible time per page view">
              <DataTable
                caption="Pages"
                rows={d.top}
                initialSort="pageviews"
                cols={[
                  { key: "path", label: "Page", render: (x) => <span title={x.path}>{pageLabel(x.path)}</span>, sort: (x) => x.path },
                  { key: "pageviews", label: "Views", right: true, render: (x) => num(x.pageviews), sort: (x) => x.pageviews },
                  { key: "visitors", label: "Visitors", right: true, render: (x) => num(x.visitors), sort: (x) => x.visitors },
                  { key: "eng", label: "Avg. engagement", right: true, render: (x) => duration(x.avg_engagement_ms), sort: (x) => x.avg_engagement_ms },
                ]}
              />
            </Panel>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Entry pages" note="First page of a session">
                <BarList valueLabel="Sessions" format={num} rows={d.entries.map((x) => ({ key: x.path, label: pageLabel(x.path), value: x.sessions }))} />
              </Panel>
              <Panel title="Exit pages" note="Last page of a session">
                <BarList valueLabel="Sessions" format={num} rows={d.exits.map((x) => ({ key: x.path, label: pageLabel(x.path), value: x.sessions }))} />
              </Panel>
            </div>
          </div>
        );
      }}
    </Async>
  );
}
