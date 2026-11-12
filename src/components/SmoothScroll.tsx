"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

let lenisInstance: Lenis | null = null;
export const getLenis = () => lenisInstance;

/** Lenis smooth scrolling driven by the GSAP ticker so ScrollTrigger stays in sync. */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.11, anchors: { offset: -24 }, autoRaf: false });
    lenisInstance = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        // Wait for pinned sections to be measured, then jump to the anchor.
        const id = window.setTimeout(() => {
          ScrollTrigger.refresh();
          const host = target.parentElement?.classList.contains("pin-spacer") ? target.parentElement : target;
          if (lenisInstance) lenisInstance.scrollTo(host as HTMLElement, { offset: 0, immediate: true });
          else host.scrollIntoView();
        }, 600);
        return () => window.clearTimeout(id);
      }
    }
    lenisInstance?.scrollTo(0, { immediate: true });
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
