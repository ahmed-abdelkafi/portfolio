"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/**
 * A fine ring with spring physics (Motion). Over [data-cursor="label"] it
 * becomes an accent disc with the label. Colours come from theme variables,
 * so the cursor follows the active palette. Fine pointers only.
 */
export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.6 });
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const id = window.setTimeout(() => setEnabled(true), 0);
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setLabel((e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? null);
    };
    const leave = () => {
      x.set(-100);
      y.set(-100);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div className="cursor" style={{ x: sx, y: sy }} aria-hidden>
      <motion.div
        className="mono grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent text-[10px] text-bone transition-colors duration-300"
        animate={label ? { width: 96, height: 96 } : { width: 28, height: 28 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        style={{ backgroundColor: label ? "var(--accent)" : "transparent" }}
      >
        {label}
      </motion.div>
    </motion.div>
  );
}
