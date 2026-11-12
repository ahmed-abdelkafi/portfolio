"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { featuredOf, workHref } from "@/content";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { sceneNo } from "@/lib/theme";
import { useContent } from "./ContentProvider";
import Magnetic from "./Magnetic";
import LayerBadges from "./LayerBadges";
import Showcase from "./Showcase";

/**
 * SC.04 — Selected work. Desktop: the scene pins and five projects travel
 * horizontally. As each frame enters, its image opens from a thin letterbox
 * slit to the full frame, drifts inside its mount, and the oversized title
 * slides at a different speed for depth. Mobile / reduced motion: stacked.
 */
export default function Work() {
  const content = useContent();
  const { ui, locale } = content;
  const t = ui.work;
  const featured = featuredOf(content);
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const sec = section.current;
      const tr = track.current;
      if (!sec || !tr) return;
      const distance = () => tr.scrollWidth - window.innerWidth;
      const tween = gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
            if (counter.current) counter.current.textContent = String(Math.min(featured.length, Math.floor(self.progress * featured.length) + 1)).padStart(2, "0");
          },
        },
      });
      gsap.utils.toArray<HTMLElement>("[data-panel]", tr).forEach((panel) => {
        const st = { trigger: panel, containerAnimation: tween, start: "left 85%", end: "left 25%", scrub: true };
        const visual = panel.querySelector("[data-visual]");
        const inner = panel.querySelector("[data-visual-inner]");
        const title = panel.querySelector("[data-panel-title]");
        if (visual) gsap.fromTo(visual, { clipPath: "inset(42% 0% 42% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: st });
        if (inner) gsap.fromTo(inner, { xPercent: 4, scale: 1.12 }, { xPercent: -4, scale: 1, ease: "none", scrollTrigger: { ...st, start: "left right", end: "right left" } });
        if (title) gsap.fromTo(title, { xPercent: 18 }, { xPercent: -10, ease: "none", scrollTrigger: { ...st, start: "left right", end: "right left" } });
      });
      ScrollTrigger.refresh();
    });
    return () => mm.revert();
  }, [featured.length]);

  return (
    <section ref={section} id="work" data-scene="dark" aria-labelledby="work-title" className="relative overflow-hidden lg:h-[100svh]">
      <div className="shell mono pointer-events-none absolute inset-x-0 top-24 z-10 hidden justify-between lg:flex">
        <span>
          {sceneNo(5)} <span className="opacity-50">— {t.label.replace(/^\d+\s—\s/, "")}</span>
        </span>
        <span>
          <span ref={counter}>01</span> <span className="opacity-50">/ {String(featured.length).padStart(2, "0")}</span>
        </span>
      </div>
      <div className="shell pointer-events-none absolute inset-x-0 bottom-10 z-10 hidden lg:block">
        <div className="h-px w-full bg-bone/15">
          <div ref={bar} className="h-px origin-left scale-x-0 bg-red" />
        </div>
      </div>

      <div ref={track} className="flex flex-col lg:h-full lg:w-max lg:flex-row lg:items-center">
        <div className="shell flex shrink-0 flex-col justify-center py-28 lg:w-[44vw] lg:py-0">
          <p className="mono lg:hidden">
            {sceneNo(5)} <span className="opacity-50">— {t.label.replace(/^\d+\s—\s/, "")}</span>
          </p>
          <h2 id="work-title" className="cut mt-6 text-[clamp(72px,10vw,200px)]">
            {t.title[0]}
            <br />
            <span className="serif-i font-normal normal-case tracking-normal text-red" style={{ fontVariationSettings: "normal" }}>
              {t.title[1]}
            </span>
            <br />
            {t.title[2]}
          </h2>
          <p className="mt-8 max-w-sm leading-relaxed opacity-75">{t.intro}</p>
          <p className="mono mt-10 hidden opacity-60 lg:block">{t.scroll}</p>
        </div>

        {featured.map((p, i) => (
          <article key={p.slug} data-panel className="relative shrink-0 py-16 lg:w-[78vw] lg:py-0 lg:pr-[6vw]" aria-labelledby={`work-${p.slug}`}>
            <span data-panel-title className="cut pointer-events-none absolute -top-[0.35em] left-[4vw] hidden whitespace-nowrap text-[clamp(120px,15vw,280px)] text-bone/[0.06] lg:block" aria-hidden>
              {p.name}
            </span>
            <div className="shell relative grid gap-8 lg:grid-cols-12 lg:items-end lg:px-0">
              <Link href={workHref(locale, p.slug)} className="block lg:col-span-8" data-cursor={t.caseStudy} aria-label={`${p.name}, ${t.caseStudy}`} tabIndex={-1}>
                <Showcase project={p} labels={ui.visual} priority={i === 0} caption={false} sizes="(min-width: 1024px) 50vw, 100vw" />
              </Link>
              <div className="lg:col-span-4">
                <p className="mono flex items-center gap-4">
                  <span className="text-red">{p.index}</span>
                  <span className="h-px w-10 bg-current opacity-30" />
                  <span className="opacity-60">{p.period}</span>
                </p>
                <h3 id={`work-${p.slug}`} className="cut mt-5 text-[clamp(52px,5vw,96px)]">
                  {p.name}
                </h3>
                <p className="serif-i mt-2 text-2xl opacity-85">{p.kind}</p>
                <p className="mt-5 leading-relaxed opacity-75">{p.summary}</p>
                <p className="mono mt-5 leading-6 opacity-60">{p.stack.slice(0, 6).join(" · ")}</p>
                <div className="mt-5">
                  <LayerBadges slug={p.slug} locale={locale} />
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <Magnetic>
                    <Link href={workHref(locale, p.slug)} className="btn">
                      {t.caseStudy} →
                    </Link>
                  </Magnetic>
                  {p.live && (
                    <a href={p.live.href} target="_blank" rel="noreferrer" className="mono u-link">
                      {t.live} ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}

        <div className="shell flex shrink-0 flex-col justify-center py-24 lg:w-[34vw] lg:py-0">
          <p className="mono opacity-60">{t.more}</p>
          <a href="#index" className="cut mt-4 text-[clamp(56px,6vw,120px)] transition-colors hover:text-red">
            {t.fullIndex}
          </a>
        </div>
      </div>
    </section>
  );
}
