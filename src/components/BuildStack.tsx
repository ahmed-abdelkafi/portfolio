"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { layerName, stackLayers } from "@/content/architecture";
import { workHref } from "@/content";
import { gsap } from "@/lib/gsap";
import { sceneNo } from "@/lib/theme";
import { useContent } from "./ContentProvider";

/**
 * SC.03 — How I build. The full stack as an exploded view: five slabs
 * (interface → API → data → cloud → quality) stacked in perspective. On
 * desktop the scene pins; scrolling separates the slabs and walks through
 * them one by one, with what I do at that layer and the projects that prove it.
 * Mobile / reduced motion: the five layers as a readable list.
 */
export default function BuildStack() {
  const { projects, locale } = useContent();
  const fr = locale === "fr";
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const nameOf = (slug: string) => projects.find((p) => p.slug === slug)?.name ?? slug;

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const sec = section.current;
      if (!sec) return;
      setPinned(true);
      const slabs = gsap.utils.toArray<HTMLElement>("[data-slab]", sec);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: "+=260%",
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => setActive(Math.min(stackLayers.length - 1, Math.floor(self.progress * stackLayers.length))),
        },
      });
      // Compressed stack → exploded view.
      tl.fromTo(slabs, { z: (i) => (2 - i) * 22 }, { z: (i) => (2 - i) * 100, ease: "power2.out", duration: 0.25 }, 0);
      tl.to({}, { duration: 0.75 });
      return () => setPinned(false);
    });
    return () => mm.revert();
  }, []);

  const layer = stackLayers[active];

  return (
    <section ref={section} id="build" data-scene="dark" aria-labelledby="build-title" className="relative overflow-hidden py-28 lg:h-[100svh] lg:py-0">
      <div className="shell lg:flex lg:h-full lg:flex-col lg:justify-center">
        <div className="mono flex justify-between border-b hair pb-4">
          <span>
            {sceneNo(3)} <span className="opacity-50">— {fr ? "Comment je construis" : "How I build"}</span>
          </span>
          <span className="opacity-60">{fr ? "Du navigateur à la base de données" : "From the browser to the database"}</span>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <h2 id="build-title" className="text-[clamp(40px,5vw,88px)] font-semibold leading-[0.95] tracking-[-0.035em]">
              {fr ? "Une seule personne, " : "One developer, "}
              <span className="serif-i font-normal text-red">{fr ? "toute la stack." : "the whole stack."}</span>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed opacity-75">
              {fr
                ? "Je conçois et livre chaque couche d'un produit : l'interface, l'API, la base de données, l'infrastructure, et les tests qui tiennent le tout."
                : "I design and ship every layer of a product: the interface, the API, the database, the infrastructure, and the tests that hold it together."}
            </p>

            {/* Desktop: detail of the active layer */}
            <div className="mt-10 hidden min-h-[300px] lg:block" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div key={layer.layer} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                  <p className="mono text-red">
                    {String(active + 1).padStart(2, "0")} / 05 · {layerName[layer.layer][locale]}
                  </p>
                  <p className="mt-3 text-2xl font-semibold leading-snug">{layer.what[locale]}</p>
                  <p className="mono mt-4 leading-6 opacity-60">{layer.tools.join(" · ")}</p>
                  <ul className="mt-5">
                    {layer.proof.map((p) => (
                      <li key={p.slug} className="border-t hair">
                        <Link href={workHref(locale, p.slug)} className="flex items-baseline justify-between gap-4 py-2.5">
                          <span className="font-semibold">{nameOf(p.slug)}</span>
                          <span className="serif-i text-right opacity-80">{p.claim[locale]}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Exploded stack (desktop) */}
          <div className="hidden lg:col-span-6 lg:col-start-7 lg:block" aria-hidden>
            <div className="relative mx-auto h-[520px] w-full max-w-[560px] [perspective:1400px]">
              <div className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(60deg)_rotateZ(-40deg)]">
                {stackLayers.map((l, i) => {
                  const on = pinned && active === i;
                  return (
                    <div
                      key={l.layer}
                      data-slab
                      className="absolute left-1/2 top-1/2 grid h-[150px] w-[340px] place-items-center border transition-[background,border-color,box-shadow] duration-500"
                      style={{
                        marginLeft: -170,
                        marginTop: -75,
                        transform: `translateZ(${(2 - i) * 100}px)`,
                        background: on ? "var(--red)" : "color-mix(in srgb, var(--bone) 6%, var(--charcoal))",
                        borderColor: on ? "var(--red)" : "color-mix(in srgb, var(--bone) 30%, transparent)",
                        boxShadow: on ? "0 30px 60px rgba(0,0,0,.45)" : "none",
                      }}
                    >
                      <span className="cut text-4xl" style={{ color: on ? "var(--bone)" : "color-mix(in srgb, var(--bone) 75%, transparent)" }}>
                        {layerName[l.layer][locale]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile / reduced motion: list */}
          <ol className="space-y-6 lg:hidden">
            {stackLayers.map((l, i) => (
              <li key={l.layer} className="border-t hair pt-5">
                <p className="mono text-red">
                  {String(i + 1).padStart(2, "0")} · {layerName[l.layer][locale]}
                </p>
                <p className="mt-2 text-lg font-semibold leading-snug">{l.what[locale]}</p>
                <p className="mono mt-3 leading-6 opacity-60">{l.tools.join(" · ")}</p>
                <ul className="mt-3 space-y-1">
                  {l.proof.map((p) => (
                    <li key={p.slug}>
                      <Link href={workHref(locale, p.slug)} className="u-link">
                        <b>{nameOf(p.slug)}</b> <span className="serif-i opacity-80">— {p.claim[locale]}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
