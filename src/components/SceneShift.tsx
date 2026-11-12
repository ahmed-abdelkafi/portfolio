"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { scenes, type Scene } from "@/lib/theme";

/**
 * Cross-fades the page between charcoal and bone scenes. Sections declare
 * data-scene="dark" | "light"; when one crosses the middle of the viewport the
 * --bg / --fg variables tween to it (like a lighting change between shots).
 */
export default function SceneShift({ initial = "dark" }: { initial?: Scene }) {
  useEffect(() => {
    const root = document.documentElement;
    const apply = (s: Scene, instant = false) =>
      gsap.to(root, {
        "--bg": scenes[s].bg,
        "--fg": scenes[s].fg,
        duration: instant || prefersReducedMotion() ? 0 : 1,
        ease: "power2.inOut",
        overwrite: true,
      });
    apply(initial, true);
    const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]")).map((el) => {
      const parent = el.parentElement;
      const trigger = parent?.classList.contains("pin-spacer") ? parent : el;
      return ScrollTrigger.create({
        trigger,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && apply(el.dataset.scene as Scene),
      });
    });
    return () => {
      triggers.forEach((t) => t.kill());
      root.style.removeProperty("--bg");
      root.style.removeProperty("--fg");
    };
  }, [initial]);
  return null;
}
