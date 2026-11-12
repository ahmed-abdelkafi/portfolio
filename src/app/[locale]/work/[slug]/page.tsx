import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent, getProject, homeHref, isLocale, locales, workHref } from "@/content";
import { en } from "@/content/en";
import { sceneNo } from "@/lib/theme";
import Reveals from "@/components/Reveals";
import SceneShift from "@/components/SceneShift";
import Showcase from "@/components/Showcase";
import ArchDiagram from "@/components/ArchDiagram";
import LayerBadges from "@/components/LayerBadges";
import { architectures, LAYERS, layerName } from "@/content/architecture";

export function generateStaticParams() {
  return locales.flatMap((locale) => en.projects.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/work/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const c = getContent(locale);
  const project = getProject(c, slug);
  if (!project) return {};
  return {
    title: `${project.name}, ${project.kind}`,
    description: project.summary,
    alternates: { canonical: `/${locale}/work/${slug}`, languages: { en: `/en/work/${slug}`, fr: `/fr/work/${slug}` } },
    openGraph: {
      title: `${project.name} · ${c.person.name}`,
      description: project.summary,
      images: project.image ? [{ url: project.image.src }] : [{ url: c.person.photo.src }],
    },
  };
}

export default async function CaseStudy({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const c = getContent(locale);
  const project = getProject(c, slug);
  if (!project) notFound();
  const t = c.ui.caseStudy;
  const i = c.projects.findIndex((p) => p.slug === slug);
  const next = c.projects[(i + 1) % c.projects.length];
  const arch = architectures[project.slug];
  const fr = locale === "fr";

  return (
    <main id="main">
      <article>
        <header data-scene="dark" className="relative pb-20 pt-32 md:pt-40">
          <div className="shell">
            <div className="mono flex flex-wrap justify-between gap-4 border-b hair pb-4">
              <Link href={homeHref(locale, "work")} className="u-link">
                ← {t.work}
              </Link>
              <span>
                {sceneNo(Number(project.index))} <span className="opacity-50">/ 09</span>
              </span>
            </div>
            <h1 className="cut mt-12 break-words text-[clamp(72px,14vw,280px)]" data-rise data-delay={0.5}>
              {project.name}
            </h1>
            <p className="serif-i mt-4 text-[clamp(26px,3vw,48px)]" data-rise data-delay={0.65}>
              {project.kind}
            </p>
            <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-6 border-t hair pt-6 md:grid-cols-4" data-rise data-delay={0.8}>
              {[
                [t.role, project.role, false],
                [t.context, project.company, false],
                [t.period, project.period, false],
                [t.live, project.live?.label ?? t.private, true],
              ].map(([k, v, isLive]) => (
                <div key={String(k)}>
                  <dt className="mono opacity-60">{k}</dt>
                  <dd className="mt-2 text-lg font-semibold leading-snug">
                    {isLive && project.live ? (
                      <a href={project.live.href} target="_blank" rel="noreferrer" className="u-link text-red">
                        {v} ↗
                      </a>
                    ) : (
                      v
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="shell mt-16" data-open>
            <Showcase project={project} labels={c.ui.visual} priority sizes="(min-width: 1024px) 80vw, 100vw" />
          </div>
        </header>

        <section data-scene="light" className="relative py-28 md:py-40" aria-labelledby="overview">
          <div className="shell grid gap-12 md:grid-cols-12">
            <h2 id="overview" className="mono md:col-span-3">
              <span className="text-red">01</span> — {t.overview}
            </h2>
            <div className="md:col-span-9">
              <p className="text-[clamp(28px,3.4vw,56px)] font-semibold leading-[1.08] tracking-[-0.03em]" data-rise>
                {project.summary}
              </p>
              <div className="mt-16 grid gap-12 md:grid-cols-2">
                <div data-rise>
                  <span data-rule className="block h-px bg-red" />
                  <p className="mono mt-5">{t.challenge}</p>
                  <p className="serif-i mt-4 text-2xl leading-snug">{project.challenge}</p>
                </div>
                <div data-rise data-delay={0.1}>
                  <span data-rule className="block h-px bg-current" />
                  <p className="mono mt-5">{t.stack}</p>
                  <ul className="mt-4">
                    {project.stack.map((s) => (
                      <li key={s} className="border-b hair py-2 text-lg font-medium">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {arch && (
          <section data-scene="dark" className="relative py-28 md:py-40" aria-labelledby="architecture">
            <div className="shell">
              <div className="grid gap-12 md:grid-cols-12">
                <h2 id="architecture" className="mono md:col-span-3">
                  <span className="text-red">02</span> — {fr ? "Architecture" : "Architecture"}
                </h2>
                <div className="md:col-span-9">
                  <p className="text-[clamp(26px,3vw,48px)] font-semibold leading-[1.08] tracking-[-0.03em]" data-rise>
                    {fr ? "Ce que j'ai construit, " : "What I built, "}
                    <span className="serif-i font-normal text-red">{fr ? "couche par couche." : "layer by layer."}</span>
                  </p>
                  <div className="mt-6">
                    <LayerBadges slug={project.slug} locale={locale} />
                  </div>
                </div>
              </div>
              <div className="mt-14" data-rise>
                <ArchDiagram arch={arch} locale={locale} />
              </div>
              <dl className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                {LAYERS.filter((l) => arch.byLayer[l]).map((l) => (
                  <div key={l} data-rise>
                    <span data-rule className="block h-px bg-red" />
                    <dt className="mono mt-4 text-red">{layerName[l][locale]}</dt>
                    <dd className="mt-2 leading-relaxed opacity-85">{arch.byLayer[l]?.[locale]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        <section data-scene="light" className="relative py-28 md:py-40" aria-labelledby="contrib">
          <div className="shell grid gap-12 md:grid-cols-12">
            <h2 id="contrib" className="mono md:col-span-3">
              <span className="text-red">{arch ? "03" : "02"}</span> — {t.whatIDid}
            </h2>
            <ol className="md:col-span-9">
              {project.contributions.map((item, n) => (
                <li key={item} className="grid grid-cols-[3.5rem_1fr] gap-4 border-b hair py-8 md:grid-cols-[6rem_1fr]" data-rise>
                  <span className="cut text-[clamp(40px,4vw,64px)] text-red">{String(n + 1).padStart(2, "0")}</span>
                  <p className="text-[clamp(19px,1.7vw,25px)] leading-snug">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section data-scene="dark" className="relative py-28 md:py-40" aria-labelledby="results">
          <div className="shell grid gap-12 md:grid-cols-12">
            <h2 id="results" className="mono md:col-span-3">
              <span className="text-red">{arch ? "04" : "03"}</span> — {t.results}
            </h2>
            <ul className="grid gap-10 md:col-span-9 md:grid-cols-2">
              {project.results.map((r) => (
                <li key={r} data-rise>
                  <p className="serif-i text-[clamp(28px,3vw,48px)] leading-tight">{r}</p>
                  <span data-rule className="mt-6 block h-px bg-red" />
                </li>
              ))}
            </ul>
          </div>
          {project.image?.mobile && (
            <div className="shell mt-24 grid items-end gap-10 md:grid-cols-12">
              <p className="mono opacity-60 md:col-span-3">{t.mobile}</p>
              <div className="viewfinder mx-auto w-[min(300px,78vw)] md:col-span-4 md:col-start-6" data-rise>
                <span className="tick tick--tl" />
                <span className="tick tick--tr" />
                <span className="tick tick--bl" />
                <span className="tick tick--br" />
                <div className="relative aspect-[430/932] overflow-hidden">
                  <Image src={project.image.mobile} alt={`${project.name}, mobile`} fill sizes="300px" className="object-cover object-top" />
                </div>
              </div>
            </div>
          )}
        </section>
      </article>

      <Link href={workHref(locale, next.slug)} data-scene="dark" className="group relative block overflow-hidden border-t hair py-28 md:py-40" data-cursor={t.next}>
        <span className="absolute inset-0 origin-bottom scale-y-0 bg-red transition-transform duration-700 group-hover:scale-y-100" style={{ transitionTimingFunction: "var(--ease-out)" }} aria-hidden />
        <span className="shell relative block">
          <span className="mono block opacity-70">
            {t.next} · {sceneNo(Number(next.index))}
          </span>
          <span className="cut mt-6 block text-[clamp(64px,12vw,240px)]">{next.name} →</span>
        </span>
      </Link>
      <footer className="shell mono flex justify-between gap-4 py-8 opacity-70">
        <span>© 2026 {c.person.name}</span>
        <Link href={homeHref(locale, "contact")} className="u-link">
          {t.contact}
        </Link>
      </footer>
      <Reveals />
      <SceneShift initial="dark" />
    </main>
  );
}
