"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { sceneNo } from "@/lib/theme";
import CodeWindow from "./CodeWindow";
import { useContent } from "./ContentProvider";
import Magnetic from "./Magnetic";

function Letters({ text }: { text: string }) {
  return (
    <span className="flex overflow-hidden" aria-hidden>
      {text.split("").map((c, i) => (
        <span key={i} data-char className="inline-block">
          {c}
        </span>
      ))}
    </span>
  );
}

/**
 * SC.01 — Opening. Left: the name in the condensed cut, the role and the
 * full-stack flow. Right: a code editor typing a verified profile as
 * TypeScript, then a terminal running the real checks of a shipped project.
 */
export default function Hero() {
  const { person, ui, locale } = useContent();
  const t = ui.hero;
  const root = useRef<HTMLElement>(null);
  const fr = locale === "fr";

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.6 })
        .from("[data-char]", { yPercent: 105, duration: 1.3, ease: "expo.out", stagger: 0.03 })
        .from("[data-code]", { y: 40, autoAlpha: 0, duration: 1.2, ease: "expo.out" }, 0.2)
        .from("[data-hero-fade]", { autoAlpha: 0, y: 20, duration: 1, ease: "expo.out", stagger: 0.08 }, 0.5);
      gsap.matchMedia().add("(min-width: 1024px)", () => {
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-code]", { yPercent: -12, ease: "none", scrollTrigger: st });
        gsap.to("[data-name]", { yPercent: 18, ease: "none", scrollTrigger: st });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="top" data-scene="dark" aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col overflow-hidden pb-10 pt-24">
      <div className="shell mono flex justify-between" data-hero-fade>
        <span>
          {sceneNo(1)} <span className="opacity-50">— {fr ? "Ouverture" : "Opening"}</span>
        </span>
        <span className="hidden opacity-60 md:inline">
          {person.location} · {t.portfolio} 2021—2026
        </span>
        <span>
          <span className="rec text-red">●</span> {t.statusValue}
        </span>
      </div>

      <div className="shell mt-10 grid flex-1 items-center gap-12 lg:mt-0 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-6" data-name>
          <h1 id="hero-title">
            <span className="sr-only">
              {person.name}, {person.role}
            </span>
            <span className="cut block text-[clamp(72px,10.5vw,190px)]">
              <Letters text={person.first.toUpperCase()} />
            </span>
            <span className="cut block text-[clamp(64px,9.4vw,172px)] text-red">
              <Letters text={person.last.toUpperCase()} />
            </span>
          </h1>

          <p data-hero-fade className="serif-i mt-6 text-[clamp(22px,2.2vw,36px)] leading-[1.12]">
            {person.role.split(" / ").map((r, i) => (
              <span key={r} className="block">
                {i > 0 && <span className="text-red">&amp; </span>}
                {r}
              </span>
            ))}
          </p>

          <p data-hero-fade className="mono mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
            {["UI", "API", fr ? "Données" : "Data", "Cloud", fr ? "Tests" : "Tests"].map((l, i, a) => (
              <span key={l} className="flex items-center gap-3">
                <span className="border hair px-2 py-1">{l}</span>
                {i < a.length - 1 && <span className="text-red">→</span>}
              </span>
            ))}
          </p>

          <p data-hero-fade className="mt-8 max-w-lg leading-relaxed opacity-80">
            {person.intro}
          </p>

          <div data-hero-fade className="mt-8 flex flex-wrap gap-3">
            <Magnetic>
              <a href="#work" className="btn btn--red" data-cursor="Watch">
                {t.seeWork} <span aria-hidden>↓</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a href="#contact" className="btn">
                {t.getInTouch}
              </a>
            </Magnetic>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-6" data-code>
          <div className="viewfinder">
            <span className="tick tick--tl" />
            <span className="tick tick--tr" />
            <span className="tick tick--bl" />
            <span className="tick tick--br" />
            <CodeWindow person={person} locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
