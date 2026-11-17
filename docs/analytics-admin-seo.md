# Analytics, admin dashboard and SEO

## Architecture

```
Browser ──► Cloudflare (ahmed-abdelkafi.dev)
             ├─ static assets (./out, Next.js static export) ── every public page, unchanged
             └─ Worker (worker/index.ts), only for:
                  /api/collect          cookie-free event intake
                  /api/admin/*          authenticated reports (D1 queries)
                  /admin, /admin/*      server-side session gate in front of the static admin pages
                  /*/__next.*           maps Next.js RSC segment requests onto the exported files
                          │
                          └─ D1 "portfolio-analytics" (migrations/0001_init.sql)
```

Why a custom, first-party analytics backend rather than GA4 or a third-party tool:

- the site is already a Cloudflare Worker, so a D1 database is the smallest addition (no new vendor, no extra cost);
- the dashboard needs row-level queries (sessions, entry/exit pages, project clicks) that GA4 only exposes through a separate OAuth-protected API;
- it is cookie-free, stores no IP address and no identifier, so it needs no consent banner (audience-measurement exemption: first-party, anonymous, opt-out available, 13-month retention) — the privacy notice says so plainly;
- GA4 can still be added later behind a consent banner if ever needed; nothing here prevents it.

## What is recorded

| Field | Source | Notes |
|---|---|---|
| page path, locale | tracker | path only, no query string |
| referrer host, UTM tags | tracker | normalised into source / medium / campaign |
| engagement time | tracker | visible-tab time per page view |
| interactions | tracker | fixed list of event names, target = project slug / link host / anchor |
| country, region | Cloudflare `request.cf` | approximate, never coordinates or city |
| device, OS, browser family, screen bucket | server UA parse / tracker | no versions, no fingerprint |
| visitor | SHA-256(daily salt + IP + UA + host) | salt rotates every UTC day and is deleted after 2 days |
| session | server | 30 minutes of inactivity |
| returning flag | `localStorage["aa-seen"]` | a boolean, no identifier |

Not recorded: IP addresses, cookies, names, emails, form contents, precise location.

Excluded traffic: signed-in administrator (session cookie checked server-side), devices that opted out
(`localStorage["aa-optout"]`, toggles on `/en/privacy` and in Admin → Settings), Do Not Track / Global Privacy
Control, bots and crawlers (UA list + Cloudflare verified bots), any origin not in `SITE_HOSTS`, localhost.

Abuse protection on `/api/collect`: origin allow-list, 2 KB payload cap, strict validation of every field,
UUID de-duplication (`INSERT OR IGNORE`), 60 events/minute per visitor, and the endpoint always answers 204.

Retention (run by the Worker at most once every 24 h, no cron needed): events 395 days, heartbeats 2 days, salts 2 days, login attempts 1 day,
expired sessions, Search Console cache 7 days.

## Admin authentication

- No registration. The account is created with `npm run admin:create` (password typed locally, hidden,
  hashed with PBKDF2-SHA256, 100,000 iterations, random salt; only the hash reaches D1).
- Sessions: 32 random bytes in a `__Host-aa_session` cookie (HttpOnly, Secure, SameSite=Strict, 7 days);
  only its SHA-256 is stored. Sign-out and password change revoke sessions server-side.
- Every `/api/admin/*` call and every `/admin` page load checks the session in the Worker. The static admin
  HTML contains no data; data only comes from authenticated API calls.
- CSRF: SameSite=Strict + `Origin` must match the host for every POST.
- Rate limiting: 5 failed logins per client per 15 min, 20 per account per 15 min (hashed keys).
- Admin responses: `noindex`, `no-store`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `no-referrer`.
- No secrets in the repository. Secrets live in Wrangler secrets (`GSC_SERVICE_ACCOUNT`).

## First deployment

```bash
# 1. Database (once). Paste the printed database_id into wrangler.jsonc → d1_databases[0].database_id
npx wrangler d1 create portfolio-analytics
npm run db:migrate

# 2. Administrator account (once; re-run to reset the password)
npm run admin:create

# 3. Deploy
npm run deploy
```

Then open https://ahmed-abdelkafi.dev/admin, sign in, and in **Settings → Exclude this device** on each
device you use while signed out.

Local testing: `npm run db:migrate:local`, `npm run admin:create -- --local`, `npm run dev:worker`
(tracking is disabled on localhost; send test events with an `Origin` from `SITE_HOSTS`).

## Google Search Console

1. https://search.google.com/search-console → **Add property → Domain** → `ahmed-abdelkafi.dev`.
2. Copy the `google-site-verification=…` TXT value. Cloudflare dashboard → ahmed-abdelkafi.dev → DNS →
   **Add record**: type TXT, name `@`, content = that value. Back in Search Console → **Verify**.
3. **Sitemaps** → submit `https://ahmed-abdelkafi.dev/sitemap.xml`.
4. **URL inspection** → `https://ahmed-abdelkafi.dev/en` → **Request indexing** (repeat for `/fr`).

Optional: show Search Console data in the dashboard (Admin → SEO performance):

1. Google Cloud console → create a project → enable **Google Search Console API**.
2. IAM → Service accounts → create one → Keys → **Add key → JSON** (keep the file private).
3. Search Console → Settings → Users and permissions → add the service-account email, permission **Restricted**.
4. `npx wrangler secret put GSC_SERVICE_ACCOUNT` and paste the whole JSON.
5. `GSC_PROPERTY` is already `sc-domain:ahmed-abdelkafi.dev` in `wrangler.jsonc`. Deploy.

The dashboard shows only what Google returns (cached 6 h). Without the key it shows a "not connected" state.

## SEO implemented

- Per-page titles, descriptions, canonicals, hreflang (en / fr / x-default), Open Graph and X cards with
  1200×630 images (`public/og/home-*.png`; case studies use their screenshot).
- JSON-LD: `Person` + `WebSite` sitewide, `ProfilePage` on home, `CreativeWork` + `BreadcrumbList` on each case study.
- `robots.txt` (disallows `/admin`, `/api/`), `sitemap.xml` with alternates and `lastModified`.
- Privacy page per locale, linked from every footer.
- One H1 per page, alt text on content images, `lang` on `<html>`; admin pages are `noindex`.
- Content stays in the HTML (static export) and readable without JavaScript; animations only enhance it
  and respect `prefers-reduced-motion`.
- The SEO health panel re-checks all of this live from the deployed files.

Bump `lastModified` in `src/app/sitemap.ts` when content changes.
