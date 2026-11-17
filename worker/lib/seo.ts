import type { Env } from "../env";
import { json } from "./util";

/**
 * Technical SEO health check, computed live from the deployed files (sitemap, robots.txt and
 * every page listed in the sitemap). It reports what it finds; it never invents a score.
 */

type PageReport = {
  url: string;
  status: number;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  ogTitle: boolean;
  ogImage: boolean;
  twitterCard: boolean;
  lang: string | null;
  h1: number;
  images: number;
  imagesMissingAlt: number;
  jsonLdTypes: string[];
  jsonLdErrors: number;
  hreflang: number;
};

async function inspect(env: Env, url: string): Promise<PageReport> {
  const r: PageReport = {
    url,
    status: 0,
    title: null,
    description: null,
    canonical: null,
    robots: null,
    ogTitle: false,
    ogImage: false,
    twitterCard: false,
    lang: null,
    h1: 0,
    images: 0,
    imagesMissingAlt: 0,
    jsonLdTypes: [],
    jsonLdErrors: 0,
    hreflang: 0,
  };
  const res = await env.ASSETS.fetch(new Request(url));
  r.status = res.status;
  if (!res.ok) return r;

  let title = "";
  let inTitle = false;
  const scripts: string[] = [];
  let current: string | null = null;
  const rewriter = new HTMLRewriter()
    .on("html", { element: (e) => void (r.lang = e.getAttribute("lang")) })
    .on("head > title", {
      element: (e) => {
        inTitle = true;
        e.onEndTag(() => void (inTitle = false));
      },
      text: (t) => void (inTitle && (title += t.text)),
    })
    .on('meta[name="description"]', { element: (e) => void (r.description = e.getAttribute("content")) })
    .on('meta[name="robots"]', { element: (e) => void (r.robots = e.getAttribute("content")) })
    .on('meta[property="og:title"]', { element: () => void (r.ogTitle = true) })
    .on('meta[property="og:image"]', { element: () => void (r.ogImage = true) })
    .on('meta[name="twitter:card"]', { element: () => void (r.twitterCard = true) })
    .on('link[rel="canonical"]', { element: (e) => void (r.canonical = e.getAttribute("href")) })
    .on('link[rel="alternate"][hreflang]', { element: () => void r.hreflang++ })
    .on("h1", { element: () => void r.h1++ })
    .on("img", {
      element: (e) => {
        r.images++;
        // alt="" is valid for decorative images; only a missing attribute is an error.
        if (e.getAttribute("alt") === null) r.imagesMissingAlt++;
      },
    })
    .on('script[type="application/ld+json"]', {
      element: (e) => {
        current = "";
        e.onEndTag(() => {
          scripts.push(current ?? "");
          current = null;
        });
      },
      text: (t) => void (current !== null && (current += t.text)),
    });
  await rewriter.transform(res).arrayBuffer();
  r.title = title.trim() || null;

  for (const s of scripts) {
    try {
      const data = JSON.parse(s);
      const collect = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(collect);
        if (node && typeof node === "object") {
          const o = node as Record<string, unknown>;
          if (typeof o["@type"] === "string") r.jsonLdTypes.push(o["@type"]);
          if (Array.isArray(o["@graph"])) o["@graph"].forEach(collect);
        }
      };
      collect(data);
      if (!(data["@context"] || (Array.isArray(data) && data.every((d) => d["@context"])))) r.jsonLdErrors++;
    } catch {
      r.jsonLdErrors++;
    }
  }
  return r;
}

export async function seoHealth(env: Env, requestUrl: URL) {
  const origin = env.SITE_URL.replace(/\/$/, "");
  const local = (path: string) => new URL(path, requestUrl.origin).toString();

  const robotsRes = await env.ASSETS.fetch(new Request(local("/robots.txt")));
  const robotsTxt = robotsRes.ok ? await robotsRes.text() : "";
  const sitemapRes = await env.ASSETS.fetch(new Request(local("/sitemap.xml")));
  const sitemapXml = sitemapRes.ok ? await sitemapRes.text() : "";
  const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const pathsFromSitemap = [...new Set(urls.map((u) => new URL(u).pathname))];
  // Also check the French versions, which appear only as hreflang alternates in the sitemap.
  const altPaths = [...sitemapXml.matchAll(/hreflang="[a-z-]+"\s+href="([^"]+)"/g)].map((m) => new URL(m[1]).pathname);
  const paths = [...new Set([...pathsFromSitemap, ...altPaths])].slice(0, 60);

  const pages = await Promise.all(paths.map((p) => inspect(env, local(p))));
  const count = (f: (p: PageReport) => boolean) => pages.filter(f).length;
  const dupes = (key: "title" | "description") => {
    const seen = new Map<string, number>();
    for (const p of pages) if (p[key]) seen.set(p[key]!, (seen.get(p[key]!) ?? 0) + 1);
    return [...seen.values()].filter((n) => n > 1).reduce((a, n) => a + n, 0);
  };

  const checks = [
    { id: "sitemap", label: "XML sitemap", ok: sitemapRes.ok && urls.length > 0, detail: sitemapRes.ok ? `${urls.length} URLs (+ ${altPaths.length} hreflang alternates)` : `HTTP ${sitemapRes.status}` },
    {
      id: "robots",
      label: "robots.txt",
      ok: robotsRes.ok && /sitemap:/i.test(robotsTxt) && !/disallow:\s*\/\s*$/im.test(robotsTxt),
      detail: robotsRes.ok ? (/sitemap:/i.test(robotsTxt) ? "Allows crawling, declares the sitemap" : "No Sitemap line") : `HTTP ${robotsRes.status}`,
    },
    { id: "status", label: "Pages return 200", ok: count((p) => p.status !== 200) === 0, detail: `${count((p) => p.status === 200)} / ${pages.length}` },
    { id: "titles", label: "Page titles", ok: count((p) => !p.title) === 0 && dupes("title") === 0, detail: `${count((p) => !p.title)} missing · ${dupes("title")} duplicated` },
    {
      id: "descriptions",
      label: "Meta descriptions",
      ok: count((p) => !p.description) === 0 && dupes("description") === 0,
      detail: `${count((p) => !p.description)} missing · ${dupes("description")} duplicated`,
    },
    {
      id: "canonical",
      label: "Canonical URLs",
      ok: count((p) => !p.canonical || !p.canonical.startsWith(origin)) === 0,
      detail: `${count((p) => !!p.canonical)} / ${pages.length} pages · absolute on ${origin}`,
    },
    { id: "h1", label: "One H1 per page", ok: count((p) => p.h1 !== 1) === 0, detail: `${count((p) => p.h1 !== 1)} pages without exactly one H1` },
    { id: "alt", label: "Image alt text", ok: count((p) => p.imagesMissingAlt > 0) === 0, detail: `${pages.reduce((a, p) => a + p.imagesMissingAlt, 0)} images missing alt` },
    {
      id: "social",
      label: "Open Graph & X cards",
      ok: count((p) => !p.ogTitle || !p.ogImage || !p.twitterCard) === 0,
      detail: `${count((p) => p.ogTitle && p.ogImage && p.twitterCard)} / ${pages.length} complete`,
    },
    {
      id: "jsonld",
      label: "Structured data (JSON-LD)",
      ok: count((p) => p.jsonLdTypes.length === 0 || p.jsonLdErrors > 0) === 0,
      detail: `${[...new Set(pages.flatMap((p) => p.jsonLdTypes))].join(", ") || "none"} · ${pages.reduce((a, p) => a + p.jsonLdErrors, 0)} parse errors`,
    },
    { id: "hreflang", label: "Language alternates", ok: count((p) => p.hreflang < 2) === 0, detail: `${count((p) => p.hreflang >= 2)} / ${pages.length} pages` },
    {
      id: "indexable",
      label: "Indexing readiness",
      ok: count((p) => /noindex/i.test(p.robots ?? "")) === 0 && count((p) => !p.lang) === 0,
      detail: `${count((p) => /noindex/i.test(p.robots ?? ""))} noindex · ${count((p) => !p.lang)} without lang`,
    },
  ];
  return json({ checkedAt: Date.now(), origin, checks, pages });
}
