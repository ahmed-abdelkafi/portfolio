"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { sceneNo } from "@/lib/theme";
import { useContent } from "./ContentProvider";
import Clock from "./Clock";
import Magnetic from "./Magnetic";

/** SC.07 — Final scene. The call to action in the cut, a magnetic red seal, real links, and the credits line. */
export default function Contact() {
  const { person, ui, locale } = useContent();
  const t = ui.contact;
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-end-line]", { yPercent: 105, duration: 1.4, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: "[data-end-title]", start: "top 80%", once: true } });
      gsap.from("[data-seal]", { rotate: -120, scale: 0.6, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: "[data-seal]", start: "top 90%", once: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${person.email}`;
    }
  };

  return (
    <section ref={root} id="contact" data-scene="dark" aria-labelledby="contact-title" className="relative overflow-hidden pb-10 pt-32 md:pt-44">
      <div className="shell">
        <div className="mono flex justify-between border-b hair pb-4">
          <span>
            {sceneNo(8)} <span className="opacity-50">— {t.label.replace(/^\d+\s—\s/, "")}</span>
          </span>
          <span className="opacity-60">
            {person.location} · <Clock />
          </span>
        </div>

        <h2 id="contact-title" data-end-title className="cut mt-14 text-[clamp(84px,15vw,300px)]">
          <span className="line-mask">
            <span data-end-line className="block">
              {t.title[0]}
            </span>
          </span>
          <span className="line-mask">
            <span data-end-line className="block">
              {t.title[1]}
              <span className="serif-i font-normal normal-case text-red" style={{ fontVariationSettings: "normal" }}>
                {t.title[2]}
              </span>
            </span>
          </span>
        </h2>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mono opacity-60">{person.availability}</p>
            <a href={`mailto:${person.email}`} className="u-link mt-4 inline-block break-all text-[clamp(22px,3vw,48px)] font-semibold tracking-[-0.02em]">
              {person.email}
            </a>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={copy} className="btn" aria-live="polite">
                {copied ? t.copied : t.copy}
              </button>
              {person.links.map((l) => (
                <Magnetic key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer" className="btn">
                    {l.label} ↗
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>
          <div className="flex justify-center lg:col-span-4 lg:col-start-9">
            <Magnetic strength={0.25}>
              <a
                href={`mailto:${person.email}`}
                data-seal
                data-cursor="Write"
                className="relative grid h-[min(62vw,280px)] w-[min(62vw,280px)] place-items-center rounded-full bg-red text-center text-bone transition-transform duration-500 hover:scale-105"
              >
                <svg viewBox="0 0 200 200" className="absolute inset-3 animate-[spin_24s_linear_infinite]" aria-hidden>
                  <defs>
                    <path id="seal" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
                  </defs>
                  <text fill="currentColor" fontSize="12" letterSpacing="5" fontFamily="var(--font-mono-face)">
                    <textPath href="#seal">{`AHMED ABDELKAFI · ${locale === "fr" ? "DÉVELOPPEUR" : "DEVELOPER"} · SFAX · `}</textPath>
                  </text>
                </svg>
                <span className="serif-i text-3xl leading-tight">
                  {t.send}
                  <br />→
                </span>
              </a>
            </Magnetic>
          </div>
        </div>

        <footer className="mono mt-28 flex flex-col gap-4 border-t hair pt-6 opacity-70 md:flex-row md:justify-between">
          <span>© 2026 {person.name}</span>
          <span>{t.built}</span>
          <a href="#top" className="u-link">
            {t.top}
          </a>
        </footer>
      </div>
    </section>
  );
}
