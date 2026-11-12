"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { sceneNo } from "@/lib/theme";
import { useContent } from "./ContentProvider";

/**
 * SC.06 — Results. Bone scene. Each figure is set in the condensed cut and
 * stretches toward its widest width as it scrolls through the viewport
 * (variable width axis), while it counts up once and a red rule draws under it.
 */
export default function Proof() {
  const { honours, metrics, ui } = useContent();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-metric]").forEach((row) => {
        const num = row.querySelector<HTMLElement>("[data-count]");
        const rule = row.querySelector<HTMLElement>("[data-rule]");
        if (!num) return;
        gsap.fromTo(num, { "--w": 62 }, { "--w": 112, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "bottom 40%", scrub: true } });
        if (rule) gsap.from(rule, { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: row, start: "top 85%", once: true } });
        const raw = num.dataset.count ?? "";
        const target = Number(raw.replace(/[^\d.]/g, ""));
        const suffix = raw.replace(/[\d.,]/g, "");
        const comma = raw.includes(",");
        const state = { v: 0 };
        num.textContent = `0${suffix}`;
        gsap.to(state, {
          v: target,
          duration: 1.8,
          ease: "expo.out",
          scrollTrigger: { trigger: row, start: "top 85%", once: true },
          onUpdate: () => {
            const n = Math.round(state.v);
            num.textContent = (comma ? n.toLocaleString("en-US") : String(n)) + suffix;
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="proof" data-scene="light" aria-labelledby="proof-title" className="relative py-32 md:py-44">
      <div className="shell">
        <div className="mono flex justify-between border-b hair pb-4">
          <span>
            {sceneNo(7)} <span className="opacity-50">— {ui.proof.label.replace(/^\d+\s—\s/, "")}</span>
          </span>
        </div>
        <h2 id="proof-title" className="mt-14 text-[clamp(44px,6.5vw,120px)] font-semibold leading-[0.95] tracking-[-0.035em]">
          {ui.proof.title[0]} {ui.proof.title[1]}
          <span className="serif-i font-normal text-red">{ui.proof.title[2]}</span>
        </h2>

        <ul className="mt-20 grid gap-x-12 md:grid-cols-2">
          {metrics.map((m) => (
            <li key={m.label} data-metric className="py-10">
              <p
                data-count={m.value}
                aria-label={m.value}
                className="cut text-[clamp(96px,11vw,210px)] tabular-nums"
                style={{ ["--w" as string]: 62, fontVariationSettings: '"wdth" var(--w)' }}
              >
                {m.value}
              </p>
              <span data-rule className="mt-4 block h-px w-full bg-red" />
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-xl font-semibold tracking-[-0.01em]">{m.label}</p>
                <p className="mono opacity-60">{m.context}</p>
              </div>
            </li>
          ))}
        </ul>

        <ul className="mt-24 border-t hair">
          {honours.map((h) => (
            <li key={h.detail} className="grid grid-cols-[4rem_1fr] items-baseline gap-4 border-b hair py-6 md:grid-cols-[8rem_18rem_1fr]">
              <span className="mono text-red">{h.year}</span>
              <span className="serif-i text-3xl">{h.title}</span>
              <span className="col-start-2 opacity-80 md:col-start-auto">{h.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
