"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { sceneNo } from "@/lib/theme";
import { useContent } from "./ContentProvider";
import Clock from "./Clock";

const ids = ["about", "build", "path", "work", "stack", "contact"] as const;
const sceneOf: Record<(typeof ids)[number], number> = { about: 2, build: 3, path: 4, work: 5, stack: 6, contact: 8 };

export default function Nav() {
  const { ui, locale, person } = useContent();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === `/${locale}`;
  const other = locale === "en" ? "fr" : "en";
  const switchHref = pathname.replace(/^\/(en|fr)/, `/${other}`) || `/${other}`;
  const href = (id: string) => (isHome ? `#${id}` : `/${locale}#${id}`);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="shell pointer-events-none fixed inset-x-0 top-0 z-[150] mix-blend-difference text-bone">
        <nav aria-label="Main" className="flex items-center justify-between gap-4 py-6">
          <Link href={`/${locale}`} className="pointer-events-auto flex items-baseline gap-2" aria-label={`${person.name}, home`}>
            <span className="cut text-2xl">A.A.</span>
            <span className="mono hidden opacity-70 sm:inline">{person.name}</span>
          </Link>
          <div className="pointer-events-auto flex items-center gap-6">
            <span className="mono hidden opacity-70 lg:inline">
              Sfax · <Clock />
            </span>
            <Link href={switchHref} hrefLang={other} lang={other} className="mono u-link" aria-label={ui.nav.switchTo} title={ui.nav.switchTo}>
              {locale.toUpperCase()} / <span className="opacity-50">{other.toUpperCase()}</span>
            </Link>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="menu" className="mono flex items-center gap-3">
              <span className="relative block h-3 w-7" aria-hidden>
                <motion.span className="absolute left-0 top-0 h-px w-full bg-current" animate={open ? { rotate: 20, y: 6 } : { rotate: 0, y: 0 }} />
                <motion.span className="absolute bottom-0 left-0 h-px w-full bg-current" animate={open ? { rotate: -20, y: -5 } : { rotate: 0, y: 0 }} />
              </span>
              {open ? ui.nav.close : ui.nav.menu}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu"
            className="fixed inset-0 z-[140] flex flex-col justify-between bg-charcoal px-[var(--gutter)] pb-10 pt-28 text-bone"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(100% 0 0 0)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="flex flex-col border-t border-bone/15">
              {ids.map((id, i) => (
                <li key={id} className="overflow-hidden border-b border-bone/15">
                  <motion.a
                    href={href(id)}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline justify-between gap-6 py-2"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="cut text-[clamp(56px,10vw,150px)] transition-colors duration-300 group-hover:text-red">{id === "build" ? (locale === "fr" ? "Stack complète" : "Full stack") : ui.nav[id]}</span>
                    <span className="mono opacity-60">{sceneNo(sceneOf[id])}</span>
                  </motion.a>
                </li>
              ))}
            </ul>
            <div className="mono flex flex-wrap justify-between gap-6 opacity-70">
              <span>
                Sfax · <Clock />
              </span>
              <span className="flex gap-6">
                {person.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="u-link">
                    {l.label} ↗
                  </a>
                ))}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
