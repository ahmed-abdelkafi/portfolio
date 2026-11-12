"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { workHref } from "@/content";
import { useContent } from "./ContentProvider";
import Visual from "./Visual";

/**
 * Index of all nine projects on a bone scene. The open row morphs (Motion
 * layout animation) to reveal its frame and summary; the others compress.
 * Hover, focus or tap opens a row.
 */
export default function WorkIndex() {
  const { projects, ui, locale } = useContent();
  const [open, setOpen] = useState<number>(0);
  const reduce = useReducedMotion();
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 140, damping: 22 };

  return (
    <section id="index" data-scene="light" aria-labelledby="index-title" className="relative py-32 md:py-44">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b hair pb-6">
          <h2 id="index-title" className="cut text-[clamp(64px,9vw,170px)]">
            {ui.work.indexTitle}
          </h2>
          <p className="mono opacity-60">{ui.work.indexCount}</p>
        </div>

        <LayoutGroup>
          <ul>
            {projects.map((p, i) => {
              const isOpen = open === i;
              return (
                <motion.li key={p.slug} layout transition={spring} className="border-b hair" onPointerEnter={() => setOpen(i)}>
                  <motion.div layout="position" transition={spring} className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-5 md:grid-cols-[5rem_1fr_1fr_7rem]">
                    <span className="mono text-red">{p.index}</span>
                    <button type="button" onClick={() => setOpen(i)} onFocus={() => setOpen(i)} aria-expanded={isOpen} className="text-left">
                      <span className="cut block text-[clamp(40px,5vw,88px)] transition-colors" style={{ color: isOpen ? "var(--red)" : undefined }}>
                        {p.name}
                      </span>
                    </button>
                    <span className="serif-i hidden text-xl opacity-80 md:block">{p.kind}</span>
                    <span className="mono text-right opacity-60">{p.period}</span>
                  </motion.div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="body"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-8 pb-10 md:grid-cols-12 md:pl-[5rem]">
                          <div className="md:col-span-5">
                            <Visual project={p} labels={ui.visual} caption={false} sizes="(min-width: 768px) 35vw, 90vw" />
                          </div>
                          <div className="md:col-span-6 md:col-start-7">
                            <p className="text-xl leading-relaxed">{p.summary}</p>
                            <p className="mono mt-5 leading-6 opacity-60">{p.stack.join(" · ")}</p>
                            <Link href={workHref(locale, p.slug)} className="btn mt-8">
                              {ui.work.caseStudy} →
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        </LayoutGroup>
      </div>
    </section>
  );
}
