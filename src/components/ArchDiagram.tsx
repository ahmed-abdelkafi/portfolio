"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { layerName, type Arch } from "@/content/architecture";
import type { Locale } from "@/content/types";
import { gsap } from "@/lib/gsap";

const W = 1000;
const H = 560;
const COLS = 5;
const ROWS = 4;
const NW = 176;
const NH = 72;
const cx = (x: number) => 40 + NW / 2 + (x * (W - 80 - NW)) / (COLS - 1);
const cy = (y: number) => 30 + NH / 2 + (y * (H - 60 - NH)) / (ROWS - 1);

/** Straight connector between node centres (layouts are arranged so no line crosses another node). */
function edgePath(a: { x: number; y: number }, b: { x: number; y: number }) {
  return `M${cx(a.x)} ${cy(a.y)} L${cx(b.x)} ${cy(b.y)}`;
}

/**
 * A system diagram of a real project: nodes by layer, connectors that draw in
 * on scroll, and data packets travelling along them (skipped with reduced
 * motion). Desktop: SVG. Mobile: a readable vertical list of the same flows.
 */
export default function ArchDiagram({ arch, locale }: { arch: Arch; locale: Locale }) {
  const reduce = useReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const byId = Object.fromEntries(arch.nodes.map((n) => [n.id, n]));

  useEffect(() => {
    const el = svg.current;
    if (!el || reduce) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 75%", once: true } });
      tl.from("[data-node]", { opacity: 0, y: 16, duration: 0.7, ease: "expo.out", stagger: 0.07 });
      el.querySelectorAll<SVGPathElement>("[data-edge]").forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(p, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, "<0.08");
      });
    }, el);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="hidden h-auto w-full md:block" role="img" aria-label="Architecture">
        <defs>
          <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.12" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#dots)" />
        {arch.edges.map(([a, b], i) => {
          const d = edgePath(byId[a], byId[b]);
          return (
            <g key={`${a}-${b}`}>
              <path data-edge d={d} fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" />
              {!reduce && (
                <circle r="4" fill="#b3261e">
                  <animateMotion dur={`${2.4 + (i % 3) * 0.6}s`} begin={`${i * 0.35}s`} repeatCount="indefinite" path={d} />
                </circle>
              )}
            </g>
          );
        })}
        {arch.nodes.map((n) => {
          const x = cx(n.x) - NW / 2;
          const y = cy(n.y) - NH / 2;
          const ext = n.layer === "ext";
          return (
            <g key={n.id} data-node>
              <rect x={x} y={y} width={NW} height={NH} fill="var(--bg)" stroke={ext ? "currentColor" : "#b3261e"} strokeOpacity={ext ? 0.35 : 1} strokeDasharray={ext ? "4 4" : undefined} />
              <text x={x + 12} y={y + 18} fontFamily="var(--font-mono-face)" fontSize="9.5" letterSpacing="1.5" fill="#b3261e">
                {layerName[n.layer][locale].toUpperCase()}
              </text>
              <text x={x + 12} y={y + 41} fontFamily="var(--font-sans-face)" fontSize="16" fontWeight="700" fill="currentColor">
                {n.label}
              </text>
              <text x={x + 12} y={y + 60} fontFamily="var(--font-mono-face)" fontSize="10" fill="currentColor" opacity="0.65">
                {n.sub[locale]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Mobile: the same flows as a readable list */}
      <ol className="space-y-3 md:hidden">
        {arch.edges.map(([a, b]) => (
          <li key={`${a}-${b}`} className="flex items-center gap-3 border hair p-3 text-sm">
            <span className="flex-1">
              <span className="mono block text-[10px] text-red">{layerName[byId[a].layer][locale]}</span>
              <span className="font-semibold">{byId[a].label}</span>
            </span>
            <span className="text-red" aria-hidden>
              →
            </span>
            <span className="flex-1 text-right">
              <span className="mono block text-[10px] text-red">{layerName[byId[b].layer][locale]}</span>
              <span className="font-semibold">{byId[b].label}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
