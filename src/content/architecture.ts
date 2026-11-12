/**
 * Full-stack proof: the architecture of each project and the layers of the
 * stack. Only verified facts (same sources as en.ts). Where a layer of a
 * product was not Ahmed's work or is not documented (e.g. Dinertia's backend),
 * it is simply not drawn.
 */
import type { Locale } from "./types";

export type Layer = "ui" | "api" | "data" | "cloud" | "quality";
export const LAYERS: Layer[] = ["ui", "api", "data", "cloud", "quality"];

type L10n = { en: string; fr: string };
const t = (en: string, fr?: string): L10n => ({ en, fr: fr ?? en });

export type ArchNode = { id: string; label: string; sub: L10n; layer: Layer | "ext"; x: number; y: number };
export type Arch = { nodes: ArchNode[]; edges: [string, string][]; byLayer: Partial<Record<Layer, L10n>> };

export const layerName: Record<Layer | "ext", L10n> = {
  ui: t("Interface"),
  api: t("API & logic", "API & logique"),
  data: t("Data", "Données"),
  cloud: t("Cloud & delivery", "Cloud & livraison"),
  quality: t("Quality & security", "Qualité & sécurité"),
  ext: t("External", "Externe"),
};

/** The five layers of the "How I build" scene. */
export const stackLayers: { layer: Layer; what: L10n; tools: string[]; proof: { slug: string; claim: L10n }[] }[] = [
  {
    layer: "ui",
    what: t(
      "Component architecture, state, real-time interfaces and performance, in React, Next.js and Vue 3.",
      "Architecture de composants, état, interfaces temps réel et performance, en React, Next.js et Vue 3.",
    ),
    tools: ["React", "Next.js (App Router)", "Vue 3", "TypeScript", "Tailwind CSS", "shadcn/ui", "TanStack Query", "Redux Toolkit", "Pinia", "Web Workers", "PWA", "React Native"],
    proof: [
      { slug: "qrbase", claim: t("50+ components · 45% fewer API requests", "50+ composants · 45 % de requêtes en moins") },
      { slug: "videokit", claim: t("60 FPS timeline with Web Workers", "Timeline à 60 FPS avec Web Workers") },
      { slug: "dinertia", claim: t("Offline-first PWA", "PWA offline-first") },
    ],
  },
  {
    layer: "api",
    what: t(
      "REST APIs, authentication, business rules, webhooks and scheduled jobs on Node.js.",
      "API REST, authentification, règles métier, webhooks et tâches planifiées sur Node.js.",
    ),
    tools: ["Node.js", "Nest.js", "Express", "REST", "Zod", "WebSockets", "Webhooks", "Cron"],
    proof: [
      { slug: "legal-tech", claim: t("Nest.js REST API + auth", "API REST Nest.js + authentification") },
      { slug: "bitgrass", claim: t("Secure Stripe webhooks", "Webhooks Stripe sécurisés") },
      { slug: "lines-up", claim: t("Idempotent scheduled publishing", "Publication programmée idempotente") },
    ],
  },
  {
    layer: "data",
    what: t(
      "Schemas, migrations, indexes, transactions, query plans and row-level security.",
      "Schémas, migrations, index, transactions, plans de requête et sécurité au niveau des lignes.",
    ),
    tools: ["PostgreSQL", "SQL", "Supabase", "Row-level security", "Drizzle ORM", "Cloudflare D1"],
    proof: [
      { slug: "legal-tech", claim: t("Schema, migrations, EXPLAIN tuning", "Schéma, migrations, optimisation EXPLAIN") },
      { slug: "survey-engine", claim: t("Supabase RLS policies", "Politiques RLS Supabase") },
      { slug: "lines-up", claim: t("D1 + Drizzle ORM", "D1 + Drizzle ORM") },
    ],
  },
  {
    layer: "cloud",
    what: t(
      "Serverless deployment, real-time infrastructure, media storage and CI/CD.",
      "Déploiement serverless, infrastructure temps réel, stockage média et CI/CD.",
    ),
    tools: ["Cloudflare Workers", "Durable Objects", "R2", "Cron Triggers", "Docker", "GitLab CI/CD", "Preview deployments"],
    proof: [
      { slug: "lines-up", claim: t("Serverless at $0 hosting", "Serverless pour 0 $ d'hébergement") },
      { slug: "qrbase", claim: t("Real-time on Durable Objects", "Temps réel sur Durable Objects") },
      { slug: "live-streaming", claim: t("10,000+ concurrent users", "10 000+ utilisateurs simultanés") },
    ],
  },
  {
    layer: "quality",
    what: t(
      "Automated tests, access control, audit trails, monitoring and security fixes.",
      "Tests automatisés, contrôle d'accès, journaux d'audit, monitoring et corrections de sécurité.",
    ),
    tools: ["Vitest", "Jest", "React Testing Library", "Cypress", "RBAC", "2FA", "Audit log", "CSRF/XSS", "Monitoring"],
    proof: [
      { slug: "lines-up", claim: t("360+ automated tests", "360+ tests automatisés") },
      { slug: "legal-tech", claim: t("Security audit fixed & retested", "Audit de sécurité corrigé et re-testé") },
      { slug: "survey-engine", claim: t("Per-user data isolation", "Isolation des données par utilisateur") },
    ],
  },
];

/* Grid: x in 0..4 columns, y in 0..3 rows. */
export const architectures: Record<string, Arch> = {
  "lines-up": {
    nodes: [
      { id: "ui", label: "Next.js 16 UI", sub: t("FR · EN · AR (RTL)"), layer: "ui", x: 0, y: 0 },
      { id: "img", label: "WebP in browser", sub: t("EXIF/GPS stripped", "EXIF/GPS supprimés"), layer: "ui", x: 0, y: 1.5 },
      { id: "api", label: "Workers (OpenNext)", sub: t("RBAC · 2FA · Zod"), layer: "api", x: 2, y: 0 },
      { id: "cron", label: "Cron Triggers", sub: t("Idempotent publish", "Publication idempotente"), layer: "cloud", x: 2, y: 2.6 },
      { id: "db", label: "D1 + Drizzle", sub: t("Content · audit log", "Contenu · journal d'audit"), layer: "data", x: 4, y: 0 },
      { id: "r2", label: "R2", sub: t("Media storage", "Stockage média"), layer: "cloud", x: 4, y: 1.5 },
      { id: "behance", label: "Behance", sub: t("Portfolio import", "Import portfolio"), layer: "ext", x: 0, y: 3 },
      { id: "ci", label: "CI · Vitest", sub: t("360+ tests · previews"), layer: "quality", x: 4, y: 3 },
    ],
    edges: [["ui", "api"], ["api", "db"], ["img", "r2"], ["cron", "db"], ["behance", "api"], ["ci", "api"]],
    byLayer: {
      ui: t("Multilingual RTL site and admin CMS in Next.js 16; images converted to WebP in the browser.", "Site multilingue RTL et CMS d'administration en Next.js 16 ; images converties en WebP dans le navigateur."),
      api: t("Server-enforced roles on every action, 2FA, Zod validation, approval workflow.", "Rôles vérifiés côté serveur sur chaque action, 2FA, validation Zod, circuit de validation."),
      data: t("Cloudflare D1 with Drizzle ORM; audit log of every change.", "Cloudflare D1 avec Drizzle ORM ; journal d'audit de chaque changement."),
      cloud: t("Serverless on Cloudflare Workers via OpenNext, R2 media, Cron publishing; $0 hosting.", "Serverless sur Cloudflare Workers via OpenNext, médias R2, publication Cron ; 0 $ d'hébergement."),
      quality: t("360+ automated tests (incl. Workers runtime), CI with preview deployments.", "360+ tests automatisés (dont runtime Workers), CI avec déploiements de preview."),
    },
  },
  qrbase: {
    nodes: [
      { id: "ui", label: "Next.js UI", sub: t("50+ components", "50+ composants"), layer: "ui", x: 0, y: 0 },
      { id: "tq", label: "TanStack Query", sub: t("Cache · optimistic UI", "Cache · UI optimiste"), layer: "ui", x: 0, y: 2 },
      { id: "ws", label: "WebSockets", sub: t("Live stats", "Stats en direct"), layer: "api", x: 2, y: 0 },
      { id: "do", label: "Durable Objects", sub: t("Real-time state", "État temps réel"), layer: "cloud", x: 4, y: 0 },
      { id: "cron", label: "Cron Triggers", sub: t("Notifications"), layer: "cloud", x: 4, y: 2 },
      { id: "wallet", label: "Privy · OnchainKit", sub: t("wagmi · viem"), layer: "ui", x: 2, y: 2 },
      { id: "chain", label: "Solidity on Base", sub: t("Onchain payments", "Paiements onchain"), layer: "data", x: 3, y: 3 },
      { id: "r2", label: "R2", sub: t("Images"), layer: "cloud", x: 1, y: 3 },
    ],
    edges: [["ui", "ws"], ["ws", "do"], ["ui", "tq"], ["tq", "wallet"], ["wallet", "chain"], ["cron", "do"], ["tq", "r2"]],
    byLayer: {
      ui: t("Next.js + TypeScript frontend, 50+ reusable components, wallet flows.", "Frontend Next.js + TypeScript, 50+ composants réutilisables, parcours wallet."),
      api: t("Live stats over WebSockets; API calls through a centralised TanStack Query cache (45% fewer server requests).", "Stats en direct via WebSockets ; appels API via un cache TanStack Query centralisé (45 % de requêtes serveur en moins)."),
      data: t("Solidity smart contracts for onchain payments on Base.", "Smart contracts Solidity pour les paiements onchain sur Base."),
      cloud: t("Durable Objects for real-time dashboards, Cron Triggers, R2 images.", "Durable Objects pour les dashboards temps réel, Cron Triggers, images R2."),
      quality: t("Every AI-generated change reviewed; Jest tests automated.", "Chaque changement généré par IA relu ; tests Jest automatisés."),
    },
  },
  bitgrass: {
    nodes: [
      { id: "ui", label: "React · Next.js", sub: t("20+ views · Chart.js", "20+ vues · Chart.js"), layer: "ui", x: 0, y: 0 },
      { id: "tq", label: "TanStack Query", sub: t("30% faster render", "Rendu 30 % plus rapide"), layer: "ui", x: 0, y: 2 },
      { id: "stripe", label: "Stripe", sub: t("Subscriptions · billing", "Abonnements · facturation"), layer: "ext", x: 2, y: 0 },
      { id: "hooks", label: "Webhook handlers", sub: t("Signed & secure", "Signés et sécurisés"), layer: "api", x: 4, y: 0 },
      { id: "workers", label: "Workers + DO", sub: t("Real-time", "Temps réel"), layer: "cloud", x: 2, y: 2 },
      { id: "cron", label: "Cron Triggers", sub: t("Notifications"), layer: "cloud", x: 4, y: 2 },
      { id: "r2", label: "R2", sub: t("Images"), layer: "cloud", x: 3, y: 3 },
    ],
    edges: [["ui", "stripe"], ["stripe", "hooks"], ["ui", "tq"], ["tq", "workers"], ["workers", "cron"], ["workers", "r2"]],
    byLayer: {
      ui: t("Led the React/Next.js frontend: 20+ responsive views, Chart.js dashboards, CSV/PDF export.", "Direction du frontend React/Next.js : 20+ vues responsives, dashboards Chart.js, export CSV/PDF."),
      api: t("Stripe subscriptions, recurring billing and secure webhook handlers.", "Abonnements Stripe, facturation récurrente et webhooks sécurisés."),
      cloud: t("Cloudflare Workers with Durable Objects, Cron Triggers and R2.", "Cloudflare Workers avec Durable Objects, Cron Triggers et R2."),
      quality: t("TanStack Query optimisation: 30% faster rendering, standard API error handling.", "Optimisation TanStack Query : rendu 30 % plus rapide, gestion d'erreurs API standardisée."),
    },
  },
  "legal-tech": {
    nodes: [
      { id: "ui", label: "Review dashboard", sub: t("Tables · PDF annotations", "Tableaux · annotations PDF"), layer: "ui", x: 0, y: 0 },
      { id: "api", label: "Nest.js REST API", sub: t("Auth · RBAC · CSRF/XSS"), layer: "api", x: 2, y: 0 },
      { id: "db", label: "PostgreSQL", sub: t("Migrations · indexes · EXPLAIN", "Migrations · index · EXPLAIN"), layer: "data", x: 4, y: 0 },
      { id: "mon", label: "Monitoring", sub: t("Errors · logs · alerts", "Erreurs · logs · alertes"), layer: "quality", x: 2, y: 2 },
      { id: "stg", label: "Staging", sub: t("Security audit · retest", "Audit de sécurité · re-test"), layer: "quality", x: 4, y: 2 },
    ],
    edges: [["ui", "api"], ["api", "db"], ["api", "mon"], ["stg", "api"]],
    byLayer: {
      ui: t("Document review dashboard with dynamic tables and PDF annotations.", "Dashboard de revue avec tableaux dynamiques et annotations PDF."),
      api: t("Nest.js REST API, authentication, role-based access, CSRF/XSS protection.", "API REST Nest.js, authentification, accès par rôles, protection CSRF/XSS."),
      data: t("PostgreSQL schema and access policies, versioned migrations, indexes, transactions, EXPLAIN tuning.", "Schéma PostgreSQL et règles d'accès, migrations versionnées, index, transactions, optimisation EXPLAIN."),
      quality: t("Error tracking, logs, alerts, incident handling; security audit fixed and retested.", "Suivi d'erreurs, logs, alertes, incidents ; audit de sécurité corrigé et re-testé."),
    },
  },
  "survey-engine": {
    nodes: [
      { id: "web", label: "React dashboard", sub: t("Web"), layer: "ui", x: 0, y: 0 },
      { id: "app", label: "React Native app", sub: t("Push · camera", "Push · caméra"), layer: "ui", x: 0, y: 2 },
      { id: "api", label: "Nest.js backend", sub: t("Business logic", "Logique métier"), layer: "api", x: 2, y: 1 },
      { id: "db", label: "Supabase Postgres", sub: t("RLS policies", "Politiques RLS"), layer: "data", x: 4, y: 0 },
      { id: "auth", label: "Supabase Auth · Realtime", sub: t("Sessions · live updates", "Sessions · mises à jour live"), layer: "data", x: 4, y: 2 },
      { id: "stores", label: "Play · App Store", sub: t("Published", "Publiée"), layer: "ext", x: 1, y: 3 },
    ],
    edges: [["web", "api"], ["app", "api"], ["api", "db"], ["api", "auth"], ["app", "stores"]],
    byLayer: {
      ui: t("React web dashboard and a React Native app published on both stores.", "Dashboard web React et app React Native publiée sur les deux stores."),
      api: t("Nest.js backend on Supabase.", "Backend Nest.js sur Supabase."),
      data: t("Supabase Postgres, Auth and Realtime, with row-level security per user and role.", "Postgres, Auth et Realtime Supabase, avec sécurité au niveau des lignes par utilisateur et rôle."),
    },
  },
  dinertia: {
    nodes: [
      { id: "ui", label: "Vue 3 + React UI", sub: t("Pinia · TypeScript"), layer: "ui", x: 0, y: 0 },
      { id: "crm", label: "CRM · booking", sub: t("Patients · scheduling", "Patients · planning"), layer: "ui", x: 2, y: 0 },
      { id: "sw", label: "Service Worker", sub: t("Offline-first"), layer: "ui", x: 0, y: 2 },
      { id: "idb", label: "IndexedDB", sub: t("Local persistence", "Persistance locale"), layer: "data", x: 2, y: 2 },
      { id: "exp", label: "PDF / CSV export", sub: t("Reports", "Rapports"), layer: "ui", x: 4, y: 0 },
      { id: "tests", label: "Jest · Vitest", sub: t("Unit tests", "Tests unitaires"), layer: "quality", x: 4, y: 2 },
    ],
    edges: [["ui", "crm"], ["crm", "exp"], ["ui", "sw"], ["sw", "idb"], ["tests", "crm"]],
    byLayer: {
      ui: t("CRM, scheduling and self-service booking; multi-step flows in Vue 3 and React.", "CRM, planning et réservation en libre-service ; parcours multi-étapes en Vue 3 et React."),
      data: t("Offline-first persistence with Service Workers and IndexedDB.", "Persistance offline-first avec Service Workers et IndexedDB."),
      quality: t("Jest and Vitest unit tests.", "Tests unitaires Jest et Vitest."),
    },
  },
  videokit: {
    nodes: [
      { id: "ui", label: "Timeline UI", sub: t("React · Vue 3"), layer: "ui", x: 0, y: 0 },
      { id: "state", label: "Editor state", sub: t("A/V alignment", "Alignement A/V"), layer: "ui", x: 2, y: 0 },
      { id: "worker", label: "Web Workers", sub: t("Media processing", "Traitement média"), layer: "ui", x: 4, y: 0 },
      { id: "fps", label: "60 FPS main thread", sub: t("Never blocked", "Jamais bloqué"), layer: "quality", x: 2, y: 2 },
    ],
    edges: [["ui", "state"], ["state", "worker"], ["worker", "fps"]],
    byLayer: {
      ui: t("Drag-and-drop multi-track timeline with audio/video alignment.", "Timeline multipiste en glisser-déposer avec alignement audio/vidéo."),
      quality: t("Media work moved off the main thread: rendering holds at 60 FPS.", "Traitement média hors du thread principal : rendu tenu à 60 FPS."),
    },
  },
  "live-streaming": {
    nodes: [
      { id: "viewer", label: "Viewer player", sub: t("Live UI"), layer: "ui", x: 0, y: 0 },
      { id: "mod", label: "Moderator dashboard", sub: t("Real-time", "Temps réel"), layer: "ui", x: 0, y: 2 },
      { id: "ws", label: "WebSockets", sub: t("Low-latency chat", "Chat faible latence"), layer: "api", x: 2, y: 1 },
      { id: "users", label: "10,000+ users", sub: t("Concurrent", "Simultanés"), layer: "ext", x: 4, y: 1 },
    ],
    edges: [["viewer", "ws"], ["mod", "ws"], ["ws", "users"]],
    byLayer: {
      ui: t("Live viewer player and moderator dashboard.", "Lecteur live et dashboard de modération."),
      api: t("WebSocket channels for low-latency chat at 10,000+ concurrent users.", "Canaux WebSocket pour un chat à faible latence à 10 000+ utilisateurs simultanés."),
    },
  },
  drawyourcode: {
    nodes: [
      { id: "figma", label: "Figma REST API", sub: t("Tokens · layers", "Tokens · calques"), layer: "ext", x: 0, y: 1 },
      { id: "node", label: "Node.js generator", sub: t("Layer tree → code", "Calques → code"), layer: "api", x: 2, y: 1 },
      { id: "react", label: "React components", sub: t("Modular output", "Sortie modulaire"), layer: "ui", x: 4, y: 1 },
    ],
    edges: [["figma", "node"], ["node", "react"]],
    byLayer: {
      api: t("Node.js service reading the Figma REST API and generating components.", "Service Node.js qui lit l'API REST Figma et génère des composants."),
      ui: t("Modular React components from design tokens: 40% shorter handoff.", "Composants React modulaires depuis les design tokens : passage au code 40 % plus court."),
    },
  },
};

export const layersOf = (slug: string): Layer[] => {
  const a = architectures[slug];
  if (!a) return [];
  return LAYERS.filter((l) => a.byLayer[l]);
};

export const tr = (v: L10n, locale: Locale) => v[locale];
