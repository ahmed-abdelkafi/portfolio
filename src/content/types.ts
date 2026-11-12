export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

/** Two-line heading: line 1, then line 2 = pre + accent (serif italic, signal) + post. */
export type Title = [string, string, string, string];

export type Link = { label: string; href: string };
export type Metric = { value: string; label: string; context: string };

export type Project = {
  slug: string;
  index: string;
  name: string;
  kind: string;
  company: string;
  period: string;
  role: string;
  summary: string;
  challenge: string;
  contributions: string[];
  stack: string[];
  results: string[];
  live?: Link;
  image?: { src: string; mobile?: string; alt: string; note?: string };
  /** Visual motif used when no public screenshot exists. */
  motif: "timeline" | "signal" | "grid" | "pulse" | "layers" | "document" | "bars";
  featured: boolean;
};

export type Role = {
  period: string;
  start: number;
  title: string;
  company: string;
  place: string;
  summary: string;
  projects: string[];
};

export type Content = {
  locale: Locale;
  person: {
    name: string;
    first: string;
    last: string;
    role: string;
    location: string;
    timezone: string;
    utc: string;
    years: string;
    email: string;
    phone: string;
    availability: string;
    intro: string;
    photo: { src: string; alt: string; caption: string };
    links: Link[];
    languages: { name: string; level: string }[];
  };
  manifesto: string[];
  principles: { n: string; title: string; text: string }[];
  roles: Role[];
  projects: Project[];
  metrics: Metric[];
  honours: { year: string; title: string; detail: string }[];
  education: { period: string; title: string; school: string; note: string }[];
  courses: string[];
  expertise: { group: string; items: { name: string; used: string[] }[] }[];
  ui: {
    skip: string;
    nav: { about: string; path: string; work: string; stack: string; contact: string; menu: string; close: string; switchTo: string };
    hero: {
      portfolio: string;
      basedIn: string;
      practice: string;
      practiceValue: string;
      status: string;
      statusValue: string;
      tagline: string;
      seeWork: string;
      getInTouch: string;
      yrs: string;
    };
    about: { label: string; title: string; languages: string; education: string; courses: string };
    path: { label: string; title: Title; nowReading: string };
    work: {
      label: string;
      title: [string, string, string];
      intro: string;
      caseStudy: string;
      live: string;
      scroll: string;
      more: string;
      fullIndex: string;
      indexTitle: string;
      indexCount: string;
      stack: string;
    };
    stack: { label: string; title: Title; hint: string; usedIn: { one: string; other: string }; release: string };
    proof: { label: string; title: Title };
    contact: { label: string; title: Title; send: string; copy: string; copied: string; built: string; top: string };
    visual: { screenshot: string; illustration: string; fig: string };
    caseStudy: {
      work: string;
      role: string;
      context: string;
      period: string;
      live: string;
      private: string;
      overview: string;
      challenge: string;
      stack: string;
      whatIDid: string;
      results: string;
      mobile: string;
      next: string;
      contact: string;
    };
    notFound: { code: string; title: [string, string]; back: string };
  };
};
