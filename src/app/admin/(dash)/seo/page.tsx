"use client";

import { useState } from "react";
import { useApi } from "../../_lib/api";
import { dec, num, pct } from "../../_lib/format";
import { Async, DataTable, Empty, Panel } from "../../_components/ui";
import { LineChart } from "../../_components/charts";

type Health = {
  checkedAt: number;
  origin: string;
  checks: { id: string; label: string; ok: boolean; detail: string }[];
  pages: { url: string; status: number; title: string | null; description: string | null; canonical: string | null; h1: number; imagesMissingAlt: number; jsonLdTypes: string[] }[];
};
type Row = { clicks: number; impressions: number; ctr: number; position: number };
type Gsc =
  | { connected: false; property: string | null }
  | {
      connected: true;
      property: string;
      range: { startDate: string; endDate: string };
      totals: Row;
      byDate: (Row & { date: string })[];
      queries: (Row & { query: string })[];
      pages: (Row & { page: string })[];
      cachedAt: number;
    };

export default function SeoPage() {
  const [days, setDays] = useState(28);
  const health = useApi<Health>("/api/admin/seo/health");
  const gsc = useApi<Gsc>(`/api/admin/seo/search-console?days=${days}`);

  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="panel-head flex-wrap">
          <div>
            <h2 className="panel-title">Google Search performance</h2>
            <p className="label mt-1">Source: Google Search Console · separate from visitor analytics</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[7, 28, 90].map((n) => (
              <button key={n} type="button" className="chip" aria-pressed={days === n} onClick={() => setDays(n)}>
                {n} days
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body">
          <Async state={gsc} h={260}>
            {(g) => (g.connected ? <SearchConsole g={g} /> : <NotConnected property={g.property} />)}
          </Async>
        </div>
      </section>

      <Panel
        title="Technical SEO health"
        action={
          <button type="button" className="chip" aria-pressed="false" onClick={health.reload}>
            Re-run checks
          </button>
        }
      >
        <Async state={health} h={300}>
          {(h) => {
            const passed = h.checks.filter((c) => c.ok).length;
            return (
              <div className="space-y-8">
                <p className="text-[13.5px] text-[var(--muted)]">
                  <span className="num mr-2 text-3xl text-[var(--ink)]">
                    {passed}/{h.checks.length}
                  </span>
                  checks pass · computed live from the deployed sitemap, robots.txt and {h.pages.length} pages · {new Date(h.checkedAt).toLocaleString()}
                </p>
                <ul className="grid gap-2 md:grid-cols-2">
                  {h.checks.map((c) => (
                    <li key={c.id} className="flex items-start gap-3 border-b border-[var(--line)] py-3">
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${c.ok ? "bg-[var(--ink)] text-[var(--bone)]" : "bg-[var(--red)] text-[var(--bone)]"}`}
                        aria-label={c.ok ? "Pass" : "Needs attention"}
                      >
                        {c.ok ? "✓" : "!"}
                      </span>
                      <span>
                        <span className="block text-[14px] font-semibold">{c.label}</span>
                        <span className="mono block text-[11.5px] text-[var(--muted)]">{c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <DataTable
                  caption="Pages checked"
                  cap={10}
                  rows={h.pages}
                  cols={[
                    { key: "url", label: "Page", render: (p) => <span className="mono text-[12px]">{new URL(p.url).pathname}</span>, sort: (p) => p.url },
                    { key: "title", label: "Title", render: (p) => <span className="line-clamp-1 max-w-[340px]" title={p.title ?? ""}>{p.title ?? <b className="text-[var(--red)]">missing</b>}</span> },
                    { key: "desc", label: "Description", right: true, render: (p) => (p.description ? `${p.description.length} ch.` : <b className="text-[var(--red)]">missing</b>) },
                    { key: "h1", label: "H1", right: true, render: (p) => <span className={p.h1 === 1 ? "" : "text-[var(--red)]"}>{p.h1}</span> },
                    { key: "ld", label: "Schema", render: (p) => <span className="text-[12px]">{p.jsonLdTypes.join(", ") || "—"}</span> },
                    { key: "st", label: "HTTP", right: true, render: (p) => p.status },
                  ]}
                />
              </div>
            );
          }}
        </Async>
      </Panel>
    </div>
  );
}

function SearchConsole({ g }: { g: Extract<Gsc, { connected: true }> }) {
  const labels = g.byDate.map((d) => d.date);
  if (!g.byDate.length && !g.totals.impressions) {
    return <Empty title="Connected, no search data yet">Google Search Console is connected to {g.property}. Data appears once Google has shown the site in results (it lags 2–3 days).</Empty>;
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Clicks", num(g.totals.clicks)],
          ["Impressions", num(g.totals.impressions)],
          ["Click-through rate", pct(g.totals.ctr)],
          ["Average position", dec(g.totals.position)],
        ].map(([k, v], i) => (
          <div key={k} className={`panel p-5 ${i === 0 ? "!border-[var(--ink)] !bg-[var(--ink)] text-[var(--bone)]" : ""}`}>
            <p className={`label ${i === 0 ? "!text-[var(--muted-dark)]" : ""}`}>{k}</p>
            <p className="num mt-6 text-5xl">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <p className="label mb-3">Clicks per day</p>
          <LineChart height={200} labels={labels} series={[{ name: "Clicks", values: g.byDate.map((d) => d.clicks), tone: "red", area: true }]} />
        </div>
        <div>
          <p className="label mb-3">Impressions per day</p>
          <LineChart height={200} labels={labels} series={[{ name: "Impressions", values: g.byDate.map((d) => d.impressions), tone: "ink" }]} />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <p className="label mb-3">Top search queries</p>
          <DataTable
            caption="Top queries"
            rows={g.queries}
            initialSort="clicks"
            cols={[
              { key: "q", label: "Query", render: (x) => x.query, sort: (x) => x.query },
              { key: "clicks", label: "Clicks", right: true, render: (x) => num(x.clicks), sort: (x) => x.clicks },
              { key: "imp", label: "Impr.", right: true, render: (x) => num(x.impressions), sort: (x) => x.impressions },
              { key: "ctr", label: "CTR", right: true, render: (x) => pct(x.ctr), sort: (x) => x.ctr },
              { key: "pos", label: "Pos.", right: true, render: (x) => dec(x.position), sort: (x) => -x.position },
            ]}
          />
        </div>
        <div>
          <p className="label mb-3">Top landing pages</p>
          <DataTable
            caption="Top pages in Google Search"
            rows={g.pages}
            initialSort="clicks"
            cols={[
              { key: "p", label: "Page", render: (x) => <span className="mono text-[12px]">{new URL(x.page).pathname}</span>, sort: (x) => x.page },
              { key: "clicks", label: "Clicks", right: true, render: (x) => num(x.clicks), sort: (x) => x.clicks },
              { key: "imp", label: "Impr.", right: true, render: (x) => num(x.impressions), sort: (x) => x.impressions },
              { key: "pos", label: "Pos.", right: true, render: (x) => dec(x.position), sort: (x) => -x.position },
            ]}
          />
        </div>
      </div>
      <p className="label">
        {g.property} · {g.range.startDate} → {g.range.endDate} · cached {new Date(g.cachedAt).toLocaleString()} (refreshed every 6 h)
      </p>
    </div>
  );
}

function NotConnected({ property }: { property: string | null }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="serif text-3xl leading-tight">Search Console is not connected.</p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--muted)]">
          Clicks, impressions, CTR, positions and queries come only from Google. Nothing is shown or estimated until the connection is set up.
          {property ? ` Property configured: ${property}, but the service-account key is missing or invalid.` : ""}
        </p>
      </div>
      <ol className="space-y-3 text-[13.5px] leading-relaxed">
        {[
          "Verify the domain in Google Search Console (Domain property ahmed-abdelkafi.dev, DNS TXT record added in Cloudflare).",
          "In Google Cloud, create a project, enable the “Google Search Console API”, and create a service account with a JSON key.",
          "In Search Console → Settings → Users and permissions, add the service-account email with “Restricted” access.",
          "Store the key as a Worker secret:  npx wrangler secret put GSC_SERVICE_ACCOUNT  (paste the whole JSON).",
          "Set GSC_PROPERTY to sc-domain:ahmed-abdelkafi.dev in wrangler.jsonc (vars) and deploy.",
        ].map((s, i) => (
          <li key={s} className="flex gap-3">
            <span className="mono text-[11px] text-[var(--red)]">{String(i + 1).padStart(2, "0")}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
