import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent, homeHref, isLocale } from "@/content";
import PrivacyControls from "@/components/PrivacyControls";
import SceneShift from "@/components/SceneShift";
import { ogImage, siteUrl } from "@/lib/seo";

const copy = {
  en: {
    title: "Privacy",
    description: "How ahmed-abdelkafi.dev measures its audience without cookies: what is collected, why, for how long, and how to opt out.",
    back: "← Back to the portfolio",
    heading: "Privacy notice",
    updated: "Last updated: 17 November 2026",
    sections: [
      [
        "Who is responsible",
        "This website is the personal portfolio of Ahmed Abdelkafi (Sfax, Tunisia). Contact: abdelkafi.ahmed.techsup@gmail.com.",
      ],
      [
        "What is measured, and why",
        "To understand how the portfolio is used (how many visits, which pages and projects interest people, where visits come from), the site records anonymous, aggregated audience statistics with its own first-party tool hosted on Cloudflare. It records: the page viewed, the time spent on it, the referring website and campaign tags, clicks on projects and contact links (only the type of link, never the content of any form or message), the device type, operating system and browser family, a screen-width category, and the approximate country and region derived by Cloudflare from the network connection.",
      ],
      [
        "What is never collected",
        "No cookies. No advertising or cross-site tracking. No IP address is stored: it is only combined, in memory, with the browser signature and a random value that changes every day, to produce an anonymous visitor code that cannot be linked to you or to your visits on other days. No precise location, no names, no email addresses, no form contents, no passwords.",
      ],
      [
        "Device storage",
        "The site stores two small values in your browser: a flag noting that this browser has visited before (to separate new and returning visits, without any identifier) and, if you opt out, a flag that turns measurement off. Your colour theme choice is also remembered locally. None of these values is shared with anyone.",
      ],
      [
        "Provider and retention",
        "Statistics are processed on Cloudflare (Workers and D1 database) on behalf of the site owner and are not sent to Google Analytics or any other analytics company. Detailed records are deleted after 13 months; real-time heartbeat records after 2 days. Browsers that send Do Not Track or Global Privacy Control signals are not measured.",
      ],
      [
        "Your choices",
        "You can turn measurement off for this device at any time with the button below. You can also contact the site owner to ask a question about this notice.",
      ],
    ],
  },
  fr: {
    title: "Confidentialité",
    description: "Comment ahmed-abdelkafi.dev mesure son audience sans cookies : ce qui est collecté, pourquoi, combien de temps, et comment s'y opposer.",
    back: "← Retour au portfolio",
    heading: "Politique de confidentialité",
    updated: "Dernière mise à jour : 17 novembre 2026",
    sections: [
      [
        "Responsable",
        "Ce site est le portfolio personnel d'Ahmed Abdelkafi (Sfax, Tunisie). Contact : abdelkafi.ahmed.techsup@gmail.com.",
      ],
      [
        "Ce qui est mesuré, et pourquoi",
        "Pour comprendre l'usage du portfolio (nombre de visites, pages et projets consultés, provenance des visites), le site enregistre des statistiques d'audience anonymes et agrégées, avec son propre outil hébergé sur Cloudflare. Il enregistre : la page vue, le temps passé, le site d'origine et les balises de campagne, les clics sur les projets et les liens de contact (seulement le type de lien, jamais le contenu d'un formulaire ou d'un message), le type d'appareil, le système et la famille de navigateur, une catégorie de largeur d'écran, et le pays et la région approximatifs déduits par Cloudflare de la connexion réseau.",
      ],
      [
        "Ce qui n'est jamais collecté",
        "Aucun cookie. Aucun suivi publicitaire ou intersites. Aucune adresse IP n'est enregistrée : elle est seulement combinée, en mémoire, avec la signature du navigateur et une valeur aléatoire qui change chaque jour, pour produire un code visiteur anonyme qui ne peut être relié ni à vous ni à vos visites des autres jours. Aucune localisation précise, aucun nom, aucune adresse e-mail, aucun contenu de formulaire, aucun mot de passe.",
      ],
      [
        "Stockage sur l'appareil",
        "Le site enregistre deux petites valeurs dans votre navigateur : un indicateur signalant que ce navigateur est déjà venu (pour distinguer nouvelles visites et retours, sans aucun identifiant) et, si vous vous y opposez, un indicateur qui désactive la mesure. Votre choix de thème de couleurs est aussi mémorisé localement. Aucune de ces valeurs n'est partagée.",
      ],
      [
        "Prestataire et durée de conservation",
        "Les statistiques sont traitées sur Cloudflare (Workers et base D1) pour le compte du propriétaire du site et ne sont envoyées ni à Google Analytics ni à aucune autre société d'analyse. Les données détaillées sont supprimées après 13 mois, les signaux de présence en temps réel après 2 jours. Les navigateurs qui envoient les signaux Do Not Track ou Global Privacy Control ne sont pas mesurés.",
      ],
      [
        "Vos choix",
        "Vous pouvez désactiver la mesure sur cet appareil à tout moment avec le bouton ci-dessous. Vous pouvez aussi contacter le propriétaire du site pour toute question sur cette politique.",
      ],
    ],
  },
} as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = copy[locale];
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: `/${locale}/privacy`, languages: { en: "/en/privacy", fr: "/fr/privacy", "x-default": "/en/privacy" } },
    openGraph: { type: "website", title: t.title, description: t.description, url: `${siteUrl}/${locale}/privacy`, siteName: "Ahmed Abdelkafi", images: [ogImage(locale)] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [ogImage(locale).url] },
  };
}

export default async function Privacy({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const { person } = getContent(locale);
  return (
    <main id="main" data-scene="light" className="relative pb-24 pt-32 md:pt-40">
      <div className="shell max-w-4xl">
        <Link href={homeHref(locale)} className="mono u-link">
          {t.back}
        </Link>
        <h1 className="cut mt-12 text-[clamp(56px,9vw,150px)]">{t.heading}</h1>
        <p className="mono mt-4 opacity-60">{t.updated}</p>
        <div className="mt-16 space-y-12">
          {t.sections.map(([h, body]) => (
            <section key={h}>
              <h2 className="serif-i text-[clamp(26px,2.6vw,40px)] leading-tight">{h}</h2>
              <p className="mt-4 text-lg leading-relaxed opacity-85">{body}</p>
            </section>
          ))}
        </div>
        <PrivacyControls locale={locale} />
        <p className="mono mt-16 opacity-60">© 2026 {person.name}</p>
      </div>
      <SceneShift initial="light" />
    </main>
  );
}
