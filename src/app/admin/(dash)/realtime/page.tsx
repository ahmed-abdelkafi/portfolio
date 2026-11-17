"use client";

import { useApi } from "../../_lib/api";
import { ago, countryName, DEVICE_LABELS, flag, num, pageLabel } from "../../_lib/format";
import type { Realtime } from "../../_lib/types";
import { Columns } from "../../_components/charts";
import { Async, BarList, DataTable, Empty, Panel } from "../../_components/ui";

const REFRESH_MS = 15_000;

export default function RealtimePage() {
  const rt = useApi<Realtime>("/api/admin/realtime", { refreshMs: REFRESH_MS });

  return (
    <div className="space-y-6">
      <Async state={rt} h={200}>
        {(d) => {
          const minutes = Array.from({ length: 30 }, (_, i) => {
            const ts = Math.floor(d.now / 60000) * 60000 - (29 - i) * 60000;
            return { key: String(ts), label: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: d.perMinute.find((m) => m.ts === ts)?.pageviews ?? 0 };
          });
          const devices = new Map<string, number>();
          const countries = new Map<string, number>();
          for (const b of d.breakdown) {
            devices.set(b.device, (devices.get(b.device) ?? 0) + b.visitors);
            const c = b.country ?? "XX";
            countries.set(c, (countries.get(c) ?? 0) + b.visitors);
          }
          return (
            <>
              <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_2fr]">
                <section className="panel flex flex-col justify-between !border-[var(--ink)] !bg-[var(--ink)] p-6 text-[var(--bone)]">
                  <div className="flex items-center gap-3">
                    <span className="live-dot" aria-hidden />
                    <p className="label !text-[var(--muted-dark)]">Active in the last {d.windowMinutes} minutes</p>
                  </div>
                  <p className="num mt-8 text-[clamp(96px,10vw,150px)]" aria-live="polite">
                    {num(d.active)}
                  </p>
                  <p className="mt-6 text-[13px] leading-relaxed text-[var(--muted-dark)]">
                    A visitor counts as active when their browser sent a page view or a heartbeat (every 60 s while the tab is visible) in the last {d.windowMinutes} minutes. Refreshes every {REFRESH_MS / 1000} s.
                  </p>
                </section>
                <Panel title="Page views per minute" note="Last 30 minutes">
                  <div className="pt-8">
                    <Columns points={minutes} height={170} label="Page views per minute, last 30 minutes" />
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="label">−30 min</span>
                    <span className="label">now</span>
                  </div>
                </Panel>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <Panel title="Pages being viewed now">
                  {d.pages.length ? <BarList format={num} rows={d.pages.map((p) => ({ key: p.path, label: pageLabel(p.path), value: p.visitors }))} /> : <Empty title="Nobody right now">Active visitors and their current page appear here.</Empty>}
                </Panel>
                <Panel title="Active by device">
                  {devices.size ? <BarList format={num} rows={[...devices].map(([k, v]) => ({ key: k, label: DEVICE_LABELS[k] ?? k, value: v }))} /> : <Empty title="—" />}
                </Panel>
                <Panel title="Active by country">
                  {countries.size ? <BarList format={num} rows={[...countries].map(([k, v]) => ({ key: k, label: `${flag(k)}  ${countryName(k)}`, value: v }))} /> : <Empty title="—" />}
                </Panel>
              </div>

              <Panel title="Recent page views" note="Last 24 hours · newest first">
                {d.recent.length ? (
                  <DataTable
                    cap={25}
                    caption="Recent page views"
                    rows={d.recent}
                    cols={[
                      { key: "ts", label: "When", render: (x) => <span className="mono text-[12px]" title={new Date(x.ts).toLocaleString()}>{ago(x.ts, d.now)}</span> },
                      { key: "path", label: "Page", render: (x) => pageLabel(x.path) },
                      { key: "country", label: "Location", render: (x) => `${flag(x.country)} ${countryName(x.country)}${x.region ? ` · ${x.region}` : ""}` },
                      { key: "device", label: "Device", render: (x) => `${DEVICE_LABELS[x.device] ?? x.device} · ${x.browser}` },
                      { key: "source", label: "Source", render: (x) => x.source ?? "—" },
                    ]}
                  />
                ) : (
                  <Empty title="No page views in the last 24 hours" />
                )}
              </Panel>
            </>
          );
        }}
      </Async>
    </div>
  );
}
