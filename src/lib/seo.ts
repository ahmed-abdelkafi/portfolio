import type { Content, Locale, Project } from "@/content";

/** Canonical origin of the public site. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ahmed-abdelkafi.dev").replace(/\/$/, "");

export const personId = `${siteUrl}/#person`;
export const websiteId = `${siteUrl}/#website`;

/** Home page title and description: written for people first, matching how recruiters search. */
export const homeMeta: Record<Locale, { title: string; description: string; ogAlt: string }> = {
  en: {
    title: "Ahmed Abdelkafi · Senior Frontend & Full-Stack Developer",
    description:
      "Ahmed Abdelkafi, Senior Frontend & Full-Stack Developer in Sfax, Tunisia. React, Next.js, TypeScript and Node.js products, from interface to API. Available remotely.",
    ogAlt: "Ahmed Abdelkafi, Senior Frontend & Full-Stack Developer",
  },
  fr: {
    title: "Ahmed Abdelkafi · Développeur Frontend & Full-Stack Senior",
    description:
      "Ahmed Abdelkafi, développeur Frontend & Full-Stack senior à Sfax, Tunisie. Produits React, Next.js, TypeScript et Node.js, de l'interface à l'API. Disponible en remote.",
    ogAlt: "Ahmed Abdelkafi, développeur Frontend & Full-Stack senior",
  },
};

/** Social preview image for pages without their own (Next.js replaces, not merges, openGraph/twitter objects). */
export const ogImage = (locale: Locale) => ({ url: `/og/home-${locale}.png`, width: 1200, height: 630, alt: homeMeta[locale].ogAlt });

/** Trim to ~158 characters on a word boundary for meta descriptions. */
export const clip = (text: string, max = 158) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
};

export const caseStudyDescription = (p: Project, locale: Locale) =>
  clip(
    locale === "fr"
      ? `${p.name}, ${p.kind.toLowerCase()} : ${p.summary}`
      : `${p.name}, ${p.kind.toLowerCase()}: ${p.summary}`,
  );

/** Sitewide Person + WebSite graph (only verified facts from the content files). */
export function siteGraph(c: Content) {
  const { person } = c;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: person.name,
        givenName: person.first,
        familyName: person.last,
        jobTitle: c.locale === "fr" ? "Développeur Frontend & Full-Stack Senior" : "Senior Frontend & Full-Stack Developer",
        description: person.intro,
        url: `${siteUrl}/${c.locale}`,
        image: `${siteUrl}${person.photo.src}`,
        email: `mailto:${person.email}`,
        telephone: person.phone.replace(/\s+/g, ""),
        address: { "@type": "PostalAddress", addressLocality: "Sfax", addressCountry: "TN" },
        sameAs: person.links.map((l) => l.href),
        knowsLanguage: ["ar", "fr", "en"],
        alumniOf: { "@type": "CollegeOrUniversity", name: "Faculty of Sciences of Sfax" },
        knowsAbout: [
          "Frontend development",
          "Full-stack JavaScript development",
          "React",
          "Next.js",
          "TypeScript",
          "Vue 3",
          "Node.js",
          "NestJS",
          "PostgreSQL",
          "Cloudflare Workers",
          "Web accessibility",
          "Right-to-left (Arabic) interfaces",
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: person.name,
        description: homeMeta[c.locale].description,
        inLanguage: ["en", "fr"],
        publisher: { "@id": personId },
      },
    ],
  };
}

export function homeGraph(c: Content) {
  const url = `${siteUrl}/${c.locale}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profile`,
        url,
        name: homeMeta[c.locale].title,
        description: homeMeta[c.locale].description,
        inLanguage: c.locale,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
        about: { "@id": personId },
        hasPart: c.projects.map((p) => ({ "@type": "CreativeWork", "@id": `${siteUrl}/${c.locale}/work/${p.slug}#work`, name: p.name })),
      },
    ],
  };
}

export function caseStudyGraph(c: Content, p: Project) {
  const home = `${siteUrl}/${c.locale}`;
  const url = `${home}/work/${p.slug}`;
  const fr = c.locale === "fr";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        url,
        name: p.name,
        headline: `${p.name}, ${p.kind}`,
        description: caseStudyDescription(p, c.locale),
        genre: p.kind,
        inLanguage: c.locale,
        keywords: p.stack.join(", "),
        creator: { "@id": personId },
        author: { "@id": personId },
        isPartOf: { "@id": websiteId },
        ...(p.image ? { image: `${siteUrl}${p.image.src}` } : {}),
        ...(p.live ? { sameAs: p.live.href } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: c.person.name, item: home },
          { "@type": "ListItem", position: 2, name: fr ? "Projets" : "Work", item: `${home}#work` },
          { "@type": "ListItem", position: 3, name: p.name, item: url },
        ],
      },
    ],
  };
}

/** JSON-LD must not break out of its <script> element. */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
