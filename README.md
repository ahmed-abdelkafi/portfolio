# Ahmed Abdelkafi · Portfolio

"Final Cut": the portfolio as an auteur film in seven numbered scenes (SC.01–SC.07), in exactly
three colours: charcoal #1C1C1C, bone #F2EDE3 and a restrained deep red #B3261E. Opening titles with a
timecode, letterbox page transitions, a film-strip career, widescreen project reveals, end-credits stack,
and a hero code editor that types a verified developer profile in TypeScript, followed by a terminal running the real checks of a shipped project (no WebGL: Three.js was removed). Type: Archivo (condensed, variable width),
Bodoni Moda italic, JetBrains Mono. Copy always says "Developer", never "Engineer".

## Run

```bash
npm install
npm run dev        # http://localhost:3000/en  (or /fr)
npm run build && npm run start
```

Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://your-domain.com`) before deploying so
metadata, `sitemap.xml` and `robots.txt` use the real domain.

## Stack and why

| Library | Used for | Why |
|---|---|---|
| Next.js 16 (App Router, Cache Components) | Routing, static generation of every case study, metadata | Every page is prerendered |
| GSAP + ScrollTrigger | Scroll reveals, pinned horizontal work gallery, scrubbed manifesto, counters | Precise scroll choreography |
| Lenis | Smooth scrolling synced to the GSAP ticker | Makes scrubbed scenes feel continuous |
| Motion | Cursor spring, magnetic buttons, menu, morphing index rows, credits list | React-state-driven interactions |

Not installed on purpose: Lottie (no assets that need it).

## Structure

```
src/content/en.ts, fr.ts single source of truth: every fact on the site, per language
src/content/architecture.ts  full-stack proof: per-project architecture (nodes/edges by layer) + the 5 stack layers
src/app/[locale]/page.tsx       home (/en, /fr): Hero · About · Path · Work · Index · Stack · Proof · Contact
src/app/[locale]/work/[slug]    case study per project (9 × 2 languages, statically generated)
public/_redirects        "/" → "/en" on Cloudflare
src/components/          one component per section + shared primitives
public/work/             real screenshots of the two live projects
```

## Motion and accessibility

- `prefers-reduced-motion`: Lenis, GSAP scenes, the canvas loop and CSS animations are disabled; content stays fully visible.
- Horizontal pinned gallery only on screens ≥ 1024px; otherwise a vertical list.
- Custom cursor only on fine pointers; the native cursor is never hidden.
- Skip link, landmarks, `aria-expanded` on the timeline and menu, `aria-live` on the stack map.
- Gotchas: base/component CSS lives in `@layer base`/`@layer components` so Tailwind utilities win; colour-world triggers use the pin-spacer of pinned sections; `.page-in` uses `animation-fill-mode: backwards` on purpose. A held transform would become the containing block for ScrollTrigger's fixed pins and break the work gallery.

## Content notes (to confirm)

Facts come from the LinkedIn snapshot (2026-11-04), the CV fact bank and skills confirmed in November 2026.
Where sources disagreed, the most recent one was used:

1. **Years of experience**: the original resume PDF says "7+ years"; LinkedIn and all recent CVs say 5+. The site says **5+**.
2. **Tekab.dev start date**: resume says Apr 2020; LinkedIn says Aug 2021. The site uses **Aug 2021**.
3. **SASTEC internship**: resume says Jun–Oct 2019; LinkedIn says Feb–Jun 2021 (end-of-study). The site uses **Feb–Jun 2021**. The second LinkedIn entry (video-editor internship, Jul–Aug 2020) is not shown.
4. **Screenshots**: only Lines Up and QRBase have public sites. The Lines Up site still shows the studio's "Demo, placeholder content" banner. Other projects use clearly labelled illustrations, never fake UI.
5. **GitHub** has 5 public repositories; pin your best work before sharing the site.
6. The phone number is in the data file but not displayed; add it in `Contact.tsx` if you want it public.

## Deploy

Static export served by Cloudflare Workers static assets (`wrangler.jsonc`, account 15780e…1afa):

```bash
NEXT_PUBLIC_SITE_URL=https://ahmed-abdelkafi.abdelkafi-ahmed-techsup.workers.dev npm run deploy
```
