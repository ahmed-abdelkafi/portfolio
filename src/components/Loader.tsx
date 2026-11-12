"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useContent } from "./ContentProvider";

/**
 * Opening titles. A timecode runs, a red line draws across the frame, the name
 * is revealed between two letterbox bars, then the bars part to open the film.
 * Once per session; skipped with reduced motion.
 */
export default function Loader() {
  const { person, locale } = useContent();
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tc = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    let seen = false;
    try {
      seen = sessionStorage.getItem("aa-titles") === "1";
      sessionStorage.setItem("aa-titles", "1");
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || seen || reduced) {
      const id = window.setTimeout(() => setDone(true), 0);
      return () => window.clearTimeout(id);
    }
    document.documentElement.style.overflow = "hidden";
    const state = { f: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = "";
        setDone(true);
      },
    });
    tl.to(state, {
      f: 96,
      duration: 1.8,
      ease: "power1.inOut",
      onUpdate: () => {
        if (!tc.current) return;
        const f = Math.round(state.f);
        tc.current.textContent = `00:00:${String(Math.floor(f / 24)).padStart(2, "0")}:${String(f % 24).padStart(2, "0")}`;
      },
    })
      .fromTo("[data-title-line]", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut" }, 0)
      .from("[data-title-word]", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.1 }, 0.35)
      .from("[data-title-sub]", { autoAlpha: 0, y: 12, duration: 0.8, ease: "expo.out" }, 0.8)
      .to("[data-title-word], [data-title-sub]", { yPercent: -110, autoAlpha: 0, duration: 0.6, ease: "expo.in", stagger: 0.04 }, "+=0.15")
      .to("[data-title-line]", { scaleX: 0, transformOrigin: "right", duration: 0.6, ease: "expo.in" }, "<")
      .to("[data-bar-top]", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "-=0.1")
      .to("[data-bar-bottom]", { yPercent: 100, duration: 1, ease: "expo.inOut" }, "<");
    return () => {
      tl.kill();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[280] text-bone" aria-hidden>
      <div data-bar-top className="absolute inset-x-0 top-0 h-1/2 bg-charcoal" />
      <div data-bar-bottom className="absolute inset-x-0 bottom-0 h-1/2 bg-charcoal" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6">
        <span data-title-line className="absolute left-0 top-1/2 h-px w-full origin-left bg-red" />
        <p className="cut relative flex gap-[0.22em] overflow-hidden pb-2 text-[clamp(48px,9vw,150px)]">
          <span data-title-word className="inline-block">
            {person.first}
          </span>
          <span data-title-word className="inline-block">
            {person.last}
          </span>
        </p>
      </div>
      <div className="mono absolute inset-x-0 bottom-8 flex justify-between px-[var(--gutter)]" data-title-sub>
        <span>
          <span className="rec text-red">●</span> REC
        </span>
        <span ref={tc}>00:00:00:00</span>
        <span>{locale === "fr" ? "Un film en 8 scènes" : "A film in 8 scenes"}</span>
      </div>
    </div>
  );
}
