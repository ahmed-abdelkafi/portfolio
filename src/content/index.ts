import { en } from "./en";
import { fr } from "./fr";
import { locales, type Content, type Locale } from "./types";

export * from "./types";

const all: Record<Locale, Content> = { en, fr };

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);
export const getContent = (locale: Locale): Content => all[locale];
export const getProject = (c: Content, slug: string) => c.projects.find((p) => p.slug === slug);
export const featuredOf = (c: Content) => c.projects.filter((p) => p.featured);

/** Locale-aware path helpers. */
export const homeHref = (locale: string, hash?: string) => `/${locale}${hash ? `#${hash}` : ""}`;
export const workHref = (locale: string, slug: string) => `/${locale}/work/${slug}`;
