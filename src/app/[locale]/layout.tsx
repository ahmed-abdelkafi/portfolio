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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { person } = getContent(locale);
  const description = `${person.name}, ${person.role} · ${person.location}. ${person.intro}`;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${person.name} · ${person.role}`, template: `%s · ${person.name}` },
    description,
    authors: [{ name: person.name }],
    alternates: { canonical: `/${locale}`, languages: { en: "/en", fr: "/fr", "x-default": "/en" } },
    openGraph: {
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      title: `${person.name} · ${person.role}`,
      description,
      siteName: person.name,
      images: [{ url: person.photo.src, width: 1200, height: 1200, alt: person.photo.alt }],
    },
    twitter: { card: "summary", title: person.name, description },
  };
}

export const viewport: Viewport = { themeColor: "#1c1c1c", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = getContent(locale);
  const { person, projects } = content;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.role,
    image: `${siteUrl}${person.photo.src}`,
    email: `mailto:${person.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Sfax", addressCountry: "TN" },
    sameAs: person.links.map((l) => l.href),
    knowsLanguage: ["ar", "fr", "en"],
    knowsAbout: ["React", "Next.js", "Vue 3", "TypeScript", "Nest.js", "PostgreSQL", "Cloudflare Workers"],
    workExample: projects.filter((p) => p.live).map((p) => ({ "@type": "CreativeWork", name: p.name, url: p.live?.href })),
  };

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
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <Loader />
          <SmoothScroll />
          <Nav />
          {children}
          <ThemeCustomizer />
          <Cursor />
          <div className="grain" aria-hidden />
          </ThemeProvider>
        </ContentProvider>
      </body>
    </html>
  );
}
