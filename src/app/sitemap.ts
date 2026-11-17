import type { MetadataRoute } from "next";
import { en } from "@/content/en";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

/** Bumped when the published content changes (static export: there is no per-file timestamp). */
const lastModified = new Date("2026-11-17");

const entry = (path: string, priority: number, changeFrequency: "monthly" | "yearly"): MetadataRoute.Sitemap[number] => ({
  url: `${siteUrl}/en${path}`,
  lastModified,
  changeFrequency,
  priority,
  alternates: { languages: { en: `${siteUrl}/en${path}`, fr: `${siteUrl}/fr${path}`, "x-default": `${siteUrl}/en${path}` } },
});

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    entry("", 1, "monthly"),
    ...en.projects.map((p) => entry(`/work/${p.slug}`, 0.8, "monthly")),
    entry("/privacy", 0.2, "yearly"),
  ];
}
