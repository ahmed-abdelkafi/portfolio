import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, isLocale } from "@/content";
import { homeGraph, homeMeta, ldJson, ogImage, siteUrl } from "@/lib/seo";
import Hero from "@/components/Hero";
import About from "@/components/About";
import BuildStack from "@/components/BuildStack";
import Reel from "@/components/Reel";
import Work from "@/components/Work";
import WorkIndex from "@/components/WorkIndex";
import Credits from "@/components/Credits";
import Proof from "@/components/Proof";
import Contact from "@/components/Contact";
import SceneShift from "@/components/SceneShift";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = homeMeta[locale];
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: `/${locale}`, languages: { en: "/en", fr: "/fr", "x-default": "/en" } },
    openGraph: {
      type: "profile",
      firstName: "Ahmed",
      lastName: "Abdelkafi",
      title: meta.title,
      description: meta.description,
      url: `${siteUrl}/${locale}`,
      siteName: "Ahmed Abdelkafi",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      images: [ogImage(locale)],
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: [ogImage(locale).url] },
  };
}

/** Final Cut — eight scenes, lit in charcoal or bone. SC.03 proves the full stack. */
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(homeGraph(getContent(locale))) }} />
      <Hero />
      <About />
      <BuildStack />
      <Reel />
      <Work />
      <WorkIndex />
      <Credits />
      <Proof />
      <Contact />
      <SceneShift initial="dark" />
    </main>
  );
}
