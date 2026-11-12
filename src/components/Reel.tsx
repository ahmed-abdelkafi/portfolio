"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { workHref } from "@/content";
import { gsap } from "@/lib/gsap";
import { sceneNo, timecode } from "@/lib/theme";
import { useContent } from "./ContentProvider";

/**
 * SC.03 — The career as a film strip. On desktop the scene pins and the strip
 * runs horizontally through the gate; the frame in the gate is lit, the others
 * stay dim, and a timecode tracks progress. Chronological: 2021 → today.
 * Small screens: the same frames stacked vertically.
 */
export default function Reel() {
  const { roles, projects, ui, locale } = useContent();
  const frames = [...roles].reverse();
  const section = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const tc = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const nameOf = (slug: string) => projects.find((p) => p.slug === slug)?.name ?? slug;

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const sec = section.current;
      const st = strip.current;
      if (!sec || !st) return;
      setPinned(true);
      const distance = () => st.scrollWidth - window.innerWidth * 0.6;
      gsap.to(st, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.9,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setActive(Math.min(frames.length - 1, Math.round(self.progress * (frames.length - 1))));
            if (tc.current) tc.current.textContent = timecode(self.progress, 300);
          },
        },
      });
      return () => setPinned(false);
    });
    return () => mm.revert();
  }, [frames.length]);

  return (
    <section ref={section} id="path" data-scene="dark" aria-labelledby="path-title" className="relative overflow-hidden py-28 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:py-0">
      <div className="shell mono flex justify-between">
        <span>
          {sceneNo(4)} <span className="opacity-50">— {ui.path.label.replace(/^\d+\s—\s/, "")}</span>
        </span>
        <span className="hidden lg:inline">
          <span className="rec text-red">●</span> <span ref={tc}>00:00:00:00</span>
        </span>
      </div>
      <h2 id="path-title" className="shell mt-6 text-[clamp(40px,6vw,104px)] font-semibold leading-[0.95] tracking-[-0.035em]">
        {ui.path.title[0]} {ui.path.title[1]}
        <span className="serif-i font-normal text-red">{ui.path.title[2]}</span>
        {ui.path.title[3]}
      </h2>

      <div className="mt-12 lg:mt-14">
        <div ref={strip} className="flex flex-col gap-8 px-[var(--gutter)] lg:w-max lg:flex-row lg:gap-0 lg:border-y lg:border-bone/15 lg:px-[30vw]">
          {frames.map((r, i) => {
            const lit = !pinned || active === i;
            return (
              <article
                key={`${r.company}-${r.period}`}
                className="relative flex shrink-0 flex-col border border-bone/15 transition-[opacity,filter] duration-700 lg:w-[40vw] lg:border-y-0 lg:border-l-0 xl:w-[34vw]"
                style={{ opacity: lit ? 1 : 0.35, filter: lit ? "none" : "blur(1px)" }}
              >
                <div className="sprockets hidden opacity-70 lg:block" aria-hidden />
                <div className="flex flex-1 flex-col p-7 lg:min-h-[44vh]">
                  <div className="flex items-baseline justify-between">
                    <span className="cut text-[clamp(72px,7vw,128px)]" style={{ color: lit ? "var(--red)" : "inherit" }}>
                      {r.start}
                    </span>
                    <span className="mono opacity-60">F.{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="mono mt-2 opacity-60">{r.period}</p>
                  <h3 className="mt-6 text-[clamp(22px,2vw,32px)] font-bold leading-tight tracking-[-0.02em]">{r.title}</h3>
                  <p className="serif-i mt-1 text-xl opacity-80">
                    {r.company}, {r.place}
                  </p>
                  <p className="mt-4 leading-relaxed opacity-80">{r.summary}</p>
                  <ul className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6">
                    {r.projects.map((slug) => (
                      <li key={slug}>
                        <Link href={workHref(locale, slug)} className="mono u-link">
                          {nameOf(slug)} ↗
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="sprockets hidden opacity-70 lg:block" aria-hidden />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
