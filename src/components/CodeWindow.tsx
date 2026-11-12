"use client";

import { useEffect, useMemo, useState } from "react";
import type { Content } from "@/content/types";

type Seg = { t: string; c?: "k" | "s" | "p" | "c" | "n" | "b" };
type Line = Seg[];

const cls: Record<NonNullable<Seg["c"]>, string> = {
  k: "text-red", // keywords
  s: "text-bone/85", // strings
  p: "text-bone/45", // punctuation
  c: "text-bone/35 italic", // comments
  n: "text-bone", // names / keys
  b: "text-red", // booleans
};

const str = (v: string): Seg[] => [{ t: `"${v}"`, c: "s" }];
const list = (items: string[]): Seg[] => [
  { t: "[", c: "p" },
  ...items.flatMap((v, i) => [...str(v), ...(i < items.length - 1 ? [{ t: ", ", c: "p" as const }] : [])]),
  { t: "]", c: "p" },
];

/**
 * The hero centrepiece: an editor that types a TypeScript file describing
 * Ahmed (every value is from the verified profile), then a terminal that runs
 * the real checks of his Lines Up project. Reduced motion: shown complete.
 */
export default function CodeWindow({ person, locale }: { person: Content["person"]; locale: string }) {
  const fr = locale === "fr";
  const lines: Line[] = useMemo(
    () => [
      [{ t: fr ? "// ahmed.ts — développeur, de l'interface à la base de données" : "// ahmed.ts — developer, from the interface to the database", c: "c" }],
      [{ t: "export const ", c: "k" }, { t: "developer", c: "n" }, { t: " = {", c: "p" }],
      [{ t: "  name", c: "n" }, { t: ": ", c: "p" }, ...str(person.name), { t: ",", c: "p" }],
      [{ t: "  role", c: "n" }, { t: ": ", c: "p" }, ...list(person.role.split(" / ")), { t: ",", c: "p" }],
      [{ t: "  based", c: "n" }, { t: ": ", c: "p" }, ...str(`${person.location} · UTC+1`), { t: ",", c: "p" }],
      [{ t: "  experience", c: "n" }, { t: ": ", c: "p" }, ...str(`${person.years} ${fr ? "ans" : "years"}`), { t: ",", c: "p" }],
      [{ t: "  stack", c: "n" }, { t: ": {", c: "p" }],
      [{ t: "    frontend", c: "n" }, { t: ": ", c: "p" }, ...list(["React", "Next.js", "Vue 3", "TypeScript"]), { t: ",", c: "p" }],
      [{ t: "    backend", c: "n" }, { t: ": ", c: "p" }, ...list(["Node.js", "Nest.js", "Express"]), { t: ",", c: "p" }],
      [{ t: "    data", c: "n" }, { t: ": ", c: "p" }, ...list(["PostgreSQL", "Supabase", "Drizzle"]), { t: ",", c: "p" }],
      [{ t: "    cloud", c: "n" }, { t: ": ", c: "p" }, ...list(["Cloudflare Workers", "Docker", "CI/CD"]), { t: ",", c: "p" }],
      [{ t: "  },", c: "p" }],
      [{ t: "  available", c: "n" }, { t: ": ", c: "p" }, { t: "true", c: "b" }, { t: ",", c: "p" }],
      [{ t: "};", c: "p" }],
    ],
    [person, fr],
  );
  const term = useMemo(
    () => [
      { cmd: "npm run test", out: fr ? "✓ 360+ tests réussis" : "✓ 360+ tests passed" },
      { cmd: "wrangler deploy", out: fr ? "✓ Déployé sur Cloudflare Workers" : "✓ Deployed to Cloudflare Workers" },
    ],
    [fr],
  );

  const total = lines.reduce((n, l) => n + l.reduce((m, s) => m + s.t.length, 0) + 1, 0);
  const [shown, setShown] = useState(0);
  const [termStep, setTermStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const id = window.setTimeout(() => {
        setShown(total);
        setTermStep(term.length * 2);
      }, 0);
      return () => window.clearTimeout(id);
    }
    let n = 0;
    let typer = 0;
    const start = window.setTimeout(() => {
      typer = window.setInterval(() => {
        n = Math.min(total, n + 3);
        setShown(n);
        if (n >= total) {
          window.clearInterval(typer);
          let step = 0;
          const tick = () => {
            step += 1;
            setTermStep(step);
            if (step < term.length * 2) typer = window.setTimeout(tick, step % 2 ? 650 : 350);
          };
          typer = window.setTimeout(tick, 400);
        }
      }, 16);
    }, 1100);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(typer);
      window.clearTimeout(typer);
    };
  }, [total, term.length]);

  // Render lines with the first `shown` characters visible.
  let budget = shown;
  const done = shown >= total;

  return (
    <div className="w-full border border-bone/15 bg-[#232323] text-bone shadow-[0_40px_80px_rgba(0,0,0,0.45)]" role="img" aria-label={`${person.name}: ${person.role}`}>
      <div className="mono flex items-center justify-between border-b border-bone/15 px-4 py-2.5 text-[10px]">
        <span className="flex gap-4">
          <span className="border-b border-red pb-1 text-bone">ahmed.ts</span>
          <span className="opacity-40">lines-up/</span>
        </span>
        <span className="opacity-50">TypeScript · UTF-8</span>
      </div>

      <pre className="overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-[1.75] md:text-[13.5px]" aria-hidden>
        {lines.map((line, li) => {
          const visible = budget > 0;
          const out = line.map((s, si) => {
            if (budget <= 0) return null;
            const part = s.t.slice(0, budget);
            budget -= s.t.length;
            return (
              <span key={si} className={s.c ? cls[s.c] : undefined}>
                {part}
              </span>
            );
          });
          if (budget > 0) budget -= 1;
          const caretHere = !done && visible && budget <= 0;
          return (
            <div key={li} className="flex min-h-[1.75em]" style={{ visibility: visible || li === 0 ? "visible" : "hidden" }}>
              <span className="w-8 shrink-0 select-none text-right text-bone/25">{li + 1}</span>
              <span className="pl-4">
                {out}
                {caretHere && <span className="ml-px inline-block h-[1.1em] w-[7px] translate-y-[3px] bg-red" />}
              </span>
            </div>
          );
        })}
      </pre>

      <div className="border-t border-bone/15 px-4 py-3 font-mono text-[12px] leading-6" aria-hidden>
        <div className="mono mb-1 flex justify-between text-[10px] opacity-50">
          <span>{fr ? "terminal · lines-up" : "terminal · lines-up"}</span>
          <span>zsh</span>
        </div>
        {term.map((row, i) => (
          <div key={row.cmd}>
            {termStep > i * 2 && (
              <div>
                <span className="text-red">$</span> {row.cmd}
              </div>
            )}
            {termStep > i * 2 + 1 && <div className="text-bone/80">{row.out}</div>}
          </div>
        ))}
        {termStep >= term.length * 2 && (
          <div>
            <span className="text-red">$</span> <span className="rec inline-block h-[1em] w-[7px] translate-y-[2px] bg-bone/70" />
          </div>
        )}
      </div>
    </div>
  );
}
