"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/**
 * A fine ring with spring physics (Motion). Over [data-cursor="label"] it
 * becomes a red disc with the label. Fine pointers only.
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
        className="mono -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={
          label
            ? { width: 96, height: 96, backgroundColor: "#b3261e", borderColor: "#b3261e" }
            : { width: 28, height: 28, backgroundColor: "rgba(179,38,30,0)", borderColor: "#b3261e" }
        }
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        style={{ borderWidth: 1, borderStyle: "solid", display: "grid", placeItems: "center", color: "#f2ede3", fontSize: 10 }}
      >
        {label}
      </motion.div>
    </motion.div>
  );
}
