import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { getContent, isLocale, locales } from "@/content";
import { fontVars } from "@/lib/fonts";
import ContentProvider from "@/components/ContentProvider";
import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import Cursor from "@/components/Cursor";
import Loader from "@/components/Loader";
import ThemeProvider, { themeBootScript } from "@/components/ThemeProvider";
import ThemeCustomizer from "@/components/ThemeCustomizer";
import Analytics from "@/components/Analytics";
import { homeMeta, ldJson, siteGraph, siteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Defaults shared by every page of a locale; each page sets its own title, description and canonical. */
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { person } = getContent(locale);
  const meta = homeMeta[locale];
  return {
    metadataBase: new URL(siteUrl),
    title: { default: meta.title, template: `%s · ${person.name}` },
    description: meta.description,
    applicationName: person.name,
    authors: [{ name: person.name, url: `${siteUrl}/${locale}` }],
    creator: person.name,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    formatDetection: { telephone: false, email: false, address: false },
    openGraph: {
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? ["en_US"] : ["fr_FR"],
      siteName: person.name,
      images: [{ url: `/og/home-${locale}.png`, width: 1200, height: 630, alt: meta.ogAlt }],
    },
    twitter: { card: "summary_large_image", images: [`/og/home-${locale}.png`] },
  };
}

export const viewport: Viewport = { themeColor: "#1c1c1c", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = getContent(locale);
  const jsonLd = siteGraph(content);

  return (
    <html lang={locale} className={fontVars} data-scene="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <ContentProvider value={content}>
          <ThemeProvider>
          <a href="#main" className="skip-link mono">
            {content.ui.skip}
          </a>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
          <Loader />
          <SmoothScroll />
          <Nav />
          {children}
          <ThemeCustomizer />
          <Analytics />
          <Cursor />
          <div className="grain" aria-hidden />
          </ThemeProvider>
        </ContentProvider>
      </body>
    </html>
  );
}
