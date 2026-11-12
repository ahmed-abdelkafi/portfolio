"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { sceneNo } from "@/lib/theme";
import { useContent } from "./ContentProvider";

/**
 * SC.02 — Portrait. Bone scene. The portrait is developed through a mask:
 * a faded print underneath, and a sharp print revealed inside a circle that
 * follows the pointer (and widens as the section scrolls into view).
 * The manifesto is set as an editorial lede; principles as numbered columns.
 */
export default function About() {
  const { person, manifesto, principles, education, courses, ui } = useContent();
  const root = useRef<HTMLElement>(null);
  const mask = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mask.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    // Colour lens: closed until the pointer is over the portrait.
    const state = { r: 0, tr: 0, x: 50, y: 40, tx: 50, ty: 40 };
    let raf = 0;
    const paint = () => {
      state.x += (state.tx - state.x) * 0.12;
      state.y += (state.ty - state.y) * 0.12;
      state.r += (state.tr - state.r) * (reduced ? 1 : 0.1);
      el.style.clipPath = `circle(${state.r}% at ${state.x}% ${state.y}%)`;
      raf = requestAnimationFrame(paint);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      state.tx = ((e.clientX - r.left) / r.width) * 100;
      state.ty = ((e.clientY - r.top) / r.height) * 100;
      state.tr = 30;
    };
    const onLeave = () => (state.tr = 0);
    const parent = el.parentElement;
    parent?.addEventListener("pointermove", onMove);
    parent?.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(paint);

    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.from("[data-lede] [data-w]", {
        yPercent: 100,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.012,
        scrollTrigger: { trigger: "[data-lede]", start: "top 80%", once: true },
      });
      gsap.from("[data-col]", { y: 60, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: "[data-cols]", start: "top 85%", once: true } });
      gsap.from("[data-rule]", { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "expo.inOut", stagger: 0.1, scrollTrigger: { trigger: "[data-cols]", start: "top 90%", once: true } });
    }, root);

    return () => {
      cancelAnimationFrame(raf);
      parent?.removeEventListener("pointermove", onMove);
      parent?.removeEventListener("pointerleave", onLeave);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} id="about" data-scene="light" aria-labelledby="about-title" className="relative py-32 md:py-48">
      <div className="shell">
        <div className="mono flex justify-between border-b hair pb-4">
          <span>
            {sceneNo(2)} <span className="opacity-50">— {ui.about.label.replace(/^\d+\s—\s/, "")}</span>
          </span>
          <span className="opacity-60">{person.location}</span>
        </div>
        <h2 id="about-title" className="sr-only">
          {ui.about.title}
        </h2>

        <div className="mt-16 grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <figure className="viewfinder mx-auto w-full max-w-[320px] lg:mx-0">
              <span className="tick tick--tl" />
              <span className="tick tick--tr" />
              <span className="tick tick--bl" />
              <span className="tick tick--br" />
              <div className="relative aspect-square overflow-hidden bg-charcoal">
                {/* Always fully sharp: a crisp monochrome print; the lens develops it to colour. */}
                <Image src={person.photo.src} alt={person.photo.alt} fill priority sizes="320px" className="object-cover grayscale contrast-[1.08] brightness-[1.04]" />
                <div ref={mask} className="absolute inset-0" style={{ clipPath: "circle(0% at 50% 40%)" }} aria-hidden>
                  <Image src={person.photo.src} alt="" fill sizes="320px" className="object-cover" />
                </div>
              </div>
              <figcaption className="mono mt-4 flex justify-between opacity-70">
                <span>{person.photo.caption}</span>
                <span>{person.languages.map((l) => l.name.slice(0, 2).toUpperCase()).join(" · ")}</span>
              </figcaption>
            </figure>
          </div>

          <div className="lg:col-span-8">
            <p data-lede className="text-[clamp(30px,3.6vw,60px)] font-semibold leading-[1.06] tracking-[-0.025em]">
              {manifesto.map((sentence, si) => (
                <span key={si} className={si === manifesto.length - 1 ? "serif-i font-normal text-red" : ""}>
                  {sentence.split(" ").map((w, wi) => (
                    <span key={wi} className="inline-flex overflow-hidden pb-[0.08em] align-bottom">
                      <span data-w className="inline-block whitespace-pre">
                        {w}{" "}
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </p>

            <div className="mt-16 grid gap-10 sm:grid-cols-2">
              <div>
                <p className="mono opacity-60">{ui.about.languages}</p>
                <ul className="mt-4">
                  {person.languages.map((l) => (
                    <li key={l.name} className="flex items-baseline justify-between border-b hair py-2 text-lg">
                      {l.name}
                      <span className="mono opacity-60">{l.level}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mono opacity-60">{ui.about.education}</p>
                <ul className="mt-4 space-y-4">
                  {education.map((e) => (
                    <li key={e.title} className="border-b hair pb-3">
                      <span className="mono opacity-60">{e.period}</span>
                      <span className="mt-1 block text-lg font-semibold leading-snug">{e.title}</span>
                      <span className="text-sm opacity-80">
                        {e.school} · <span className="serif-i text-red">{e.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mono mt-4 opacity-60">
                  {ui.about.courses}: {courses.join(" · ")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div data-cols className="mt-28 grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-4">
          {principles.map((p) => (
            <article key={p.n} data-col>
              <span data-rule className="block h-px w-full bg-current" />
              <p className="mt-6 flex items-baseline justify-between">
                <span className="cut text-6xl text-red">{p.n}</span>
              </p>
              <h3 className="mt-4 text-2xl font-bold tracking-[-0.02em]">{p.title}</h3>
              <p className="mt-3 leading-relaxed opacity-80">{p.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
