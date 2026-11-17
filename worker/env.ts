export interface Env {
  /** Static export of the Next.js site (./out). */
  ASSETS: Fetcher;
  /** D1: events, salts, admins, sessions, login attempts, Search Console cache. */
  DB: D1Database;
  /** Comma-separated hostnames whose traffic is counted (others, e.g. localhost, are ignored). */
  SITE_HOSTS: string;
  /** Public site origin, e.g. https://ahmed-abdelkafi.dev (used by the SEO health check). */
  SITE_URL: string;
  /** Optional secret: Google service-account JSON key with read access to the Search Console property. */
  GSC_SERVICE_ACCOUNT?: string;
  /** Optional: Search Console property, e.g. "sc-domain:ahmed-abdelkafi.dev". */
  GSC_PROPERTY?: string;
}
