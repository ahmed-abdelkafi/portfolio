"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { workHref } from "@/content";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { sceneNo } from "@/lib/theme";
import { useContent } from "./ContentProvider";

/**
 * SC.05 — Stack, set as end credits. Each family is a "role" and each tool a
 * credited name. Selecting a name shows, as evidence, the productions it was
 * used on. No self-rating, no percentage bars.
 */
export default function Credits() {
  const { expertise, projects, ui, locale } = useContent();
  const fr = locale === "fr";
  const t = ui.stack;
  const root = useRef<HTMLElement>(null);
  const [sel, setSel] = useState<{ name: string; used: string[] } | null>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-credit-group]").forEach((g) => {
        gsap.from(g.querySelectorAll("[data-credit]"), {
          yPercent: 100,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.05,
          scrollTrigger: { trigger: g, start: "top 85%", once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const used = sel ? projects.filter((p) => sel.used.includes(p.slug)) : [];
  const usedText = sel ? (sel.used.length > 1 ? t.usedIn.other : t.usedIn.one).replace("{n}", String(sel.used.length)) : "";

  return (
    <section ref={root} id="stack" data-scene="dark" aria-labelledby="stack-title" className="relative py-32 md:py-44">
      <div className="shell">
        <div className="mono flex justify-between border-b hair pb-4">
          <span>
            {sceneNo(6)} <span className="opacity-50">— {fr ? "Générique de fin" : "End credits"}</span>
          </span>
          <span className="opacity-60">{t.label.replace(/^\d+\s—\s/, "")}</span>
        </div>
        <h2 id="stack-title" className="mt-14 text-center text-[clamp(40px,6vw,104px)] font-semibold leading-[0.95] tracking-[-0.035em]">
          {t.title[0]} {t.title[1]}
          <span className="serif-i font-normal text-red">{t.title[2]}</span>
          {t.title[3]}
        </h2>
        <p className="mono mt-6 text-center opacity-60">{t.hint}</p>

        <div className="mt-20 grid gap-16 lg:grid-cols-12">
          <div className="grid gap-14 sm:grid-cols-2 lg:col-span-8" onPointerLeave={() => setSel(null)}>
            {expertise.map((g) => (
              <div key={g.group} data-credit-group className="text-center">
                <p className="mono text-red">{g.group}</p>
                <ul className="mt-5 space-y-1">
                  {g.items.map((it) => {
                    const on = sel?.name === it.name;
                    return (
                      <li key={it.name} className="overflow-hidden">
                        <button
                          type="button"
                          data-credit
                          aria-pressed={on}
                          onPointerEnter={() => setSel(it)}
                          onFocus={() => setSel(it)}
                          onClick={() => setSel(on ? null : it)}
                          className="inline-block text-[clamp(24px,2.4vw,40px)] font-semibold tracking-[-0.02em] transition-[color,opacity] duration-300"
                          style={{ color: on ? "var(--red)" : undefined, opacity: sel && !on ? 0.35 : 1 }}
                        >
                          {it.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4" aria-live="polite">
            <div className="border hair p-7 lg:sticky lg:top-28">
              <p className="mono opacity-60">{sel ? usedText : "—"}</p>
              <p className="cut mt-3 min-h-[1em] text-[clamp(48px,4.4vw,80px)] text-red">{sel?.name ?? (fr ? "Choisir" : "Select")}</p>
              <ul className="mt-6 min-h-[12rem]">
                <AnimatePresence mode="popLayout">
                  {used.map((p, i) => (
                    <motion.li
                      key={p.slug}
                      layout
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
                      exit={{ opacity: 0, x: -24 }}
                      className="border-t hair"
                    >
                      <Link href={workHref(locale, p.slug)} className="flex items-baseline justify-between py-3">
                        <span className="text-lg font-semibold">{p.name}</span>
                        <span className="mono opacity-60">{p.period}</span>
                      </Link>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
