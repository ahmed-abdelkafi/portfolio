"use client";

import { useState } from "react";
import { useApi } from "../../_lib/api";
import { EVENT_LABELS, num, projectName } from "../../_lib/format";
import { daysBetween, useRange } from "../../_lib/range";
import type { BehaviorReport } from "../../_lib/types";
import { LineChart } from "../../_components/charts";
import { Async, BarList, DataTable, Delta, Empty, Panel } from "../../_components/ui";

const CONTACT = ["contact_click", "email_click", "phone_click", "whatsapp_click", "linkedin_click", "github_click", "cv_download"];

const targetLabel = (name: string, target: string) => (name === "project_click" || name === "case_study_view" ? projectName(target) : target);

export default function BehaviorPage() {
  const r = useRange();
  const rep = useApi<BehaviorReport>(`/api/admin/behavior?${r.query}`);
  const [focus, setFocus] = useState<string | null>(null);
  const days = daysBetween(r.from, r.to);

  return (
    <Async state={rep} h={320} isEmpty={(d) => d.events.length === 0} empty={<Panel title="Visitor behavior"><Empty title="No interactions in this period">Clicks on projects, contact links, LinkedIn, GitHub and navigation are recorded here as they happen.</Empty></Panel>}>
      {(d) => {
        const prev = new Map(d.previous.map((e) => [e.name, e.count]));
        const count = (n: string) => d.events.find((e) => e.name === n)?.count ?? 0;
        const contactTotal = CONTACT.reduce((a, n) => a + count(n), 0);
        const contactPrev = CONTACT.reduce((a, n) => a + (prev.get(n) ?? 0), 0);
        const byDay = new Map(d.series.map((s) => [s.day, s.count]));
        const selected = focus ?? d.events[0]?.name;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                { label: "Contact intents", cur: contactTotal, prev: contactPrev, hint: "Email, phone, WhatsApp, LinkedIn, GitHub, contact button and CV clicks", accent: true },
                { label: "Project clicks", cur: count("project_click"), prev: prev.get("project_click") ?? 0 },
                { label: "Case study views", cur: count("case_study_view"), prev: prev.get("case_study_view") ?? 0 },
                { label: "Live site visits", cur: count("live_site_click"), prev: prev.get("live_site_click") ?? 0 },
              ].map((k) => (
                <div key={k.label} title={k.hint} className={`panel flex flex-col justify-between gap-6 p-5 ${k.accent ? "!border-[var(--ink)] !bg-[var(--ink)] text-[var(--bone)]" : ""}`}>
                  <p className={`label ${k.accent ? "!text-[var(--muted-dark)]" : ""}`}>{k.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="num text-5xl">{num(k.cur)}</p>
                    <span className={k.accent ? "[&_*]:!text-[var(--bone)]" : ""}>
                      <Delta cur={k.cur} prev={k.prev} />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Panel title="Interactions over time" note="All tracked events per day">
              <LineChart height={220} labels={days} series={[{ name: "Interactions", values: days.map((x) => byDay.get(x) ?? 0), tone: "red", area: true }]} />
            </Panel>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Events" note="Select one for details">
                <DataTable
                  caption="Events"
                  rows={d.events}
                  initialSort="count"
                  cap={20}
                  cols={[
                    {
                      key: "name",
                      label: "Event",
                      render: (x) => (
                        <button type="button" onClick={() => setFocus(x.name)} className={`text-left hover:text-[var(--red)] ${selected === x.name ? "font-semibold text-[var(--red)]" : ""}`}>
                          {EVENT_LABELS[x.name] ?? x.name}
                          <span className="mono ml-2 text-[10.5px] text-[var(--muted)]">{x.name}</span>
                        </button>
                      ),
                      sort: (x) => x.name,
                    },
                    { key: "count", label: "Count", right: true, render: (x) => num(x.count), sort: (x) => x.count },
                    { key: "visitors", label: "Visitors", right: true, render: (x) => num(x.visitors), sort: (x) => x.visitors },
                    { key: "d", label: "vs. prev.", right: true, render: (x) => <Delta cur={x.count} prev={prev.get(x.name) ?? 0} /> },
                  ]}
                />
              </Panel>
              <Panel title={`Targets · ${EVENT_LABELS[selected ?? ""] ?? selected ?? ""}`} note="What was clicked">
                {(() => {
                  const rows = d.targets.filter((t) => t.name === selected);
                  return rows.length ? <BarList valueLabel="Clicks" format={num} rows={rows.map((t) => ({ key: t.target, label: targetLabel(t.name, t.target), value: t.count }))} /> : <Empty title="No target recorded" />;
                })()}
                <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--muted)]">Only the kind of link is recorded (a project slug, a website host, a section anchor), never personal data or anything typed.</p>
              </Panel>
            </div>
          </div>
        );
      }}
    </Async>
  );
}
