import type { MetadataRoute } from "next";
import { en } from "@/content/en";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
  url: `${base}/en${path}`,
  priority,
  alternates: { languages: { en: `${base}/en${path}`, fr: `${base}/fr${path}` } },
});

export default function sitemap(): MetadataRoute.Sitemap {
  return [entry("", 1), ...en.projects.map((p) => entry(`/work/${p.slug}`, 0.7))];
}
