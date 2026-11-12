"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import type { Scene } from "@/lib/theme";

/**
 * Switches the page between dark and light scenes. Sections declare
 * data-scene="dark" | "light"; when one crosses the middle of the viewport
 * html[data-scene] changes and CSS cross-fades --bg / --fg (registered
 * @property colours), so scenes follow whatever palette is active.
 */
export default function SceneShift({ initial = "dark" }: { initial?: Scene }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.scene = initial;
    const triggers = Array.from(document.querySelectorAll<HTMLElement>("main [data-scene]")).map((el) => {
      const parent = el.parentElement;
      const trigger = parent?.classList.contains("pin-spacer") ? parent : el;
      return ScrollTrigger.create({
        trigger,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => {
          if (self.isActive) root.dataset.scene = el.dataset.scene as Scene;
        },
      });
    });
    return () => {
      triggers.forEach((t) => t.kill());
      root.dataset.scene = "dark";
    };
  }, [initial]);
  return null;
}
