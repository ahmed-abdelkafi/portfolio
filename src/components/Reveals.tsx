"use client";

import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Scroll effects for case-study pages:
 *  [data-rise]    line rises out of a mask
 *  [data-open]    image frame opens from a letterbox slit (scrubbed)
 *  [data-rule]    hairline draws from the left
 */
export default function Reveals() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((el) => {
        gsap.from(el, { yPercent: 40, autoAlpha: 0, duration: 1.2, ease: "expo.out", delay: Number(el.dataset.delay ?? 0), scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-open]").forEach((el) => {
        gsap.fromTo(el, { clipPath: "inset(40% 6% 40% 6%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "center 55%", scrub: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-rule]").forEach((el) => {
        gsap.from(el, { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
      });
    });
    return () => ctx.revert();
  }, []);
  return null;
}
