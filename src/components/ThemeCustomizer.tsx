"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { COLOR_KEYS, PRESETS, ROLE_LABEL, contrast, isHex, normalizeHex, wcag, type ColorKey, type HarmonyMode } from "@/lib/themes";
import { useContent } from "./ContentProvider";
import { useTheme } from "./ThemeProvider";

const MODES: { id: HarmonyMode; en: string; fr: string }[] = [
  { id: "complementary", en: "Complementary", fr: "Complémentaire" },
  { id: "analogous", en: "Analogous", fr: "Analogue" },
  { id: "triadic", en: "Triadic", fr: "Triadique" },
  { id: "monochromatic", en: "Mono", fr: "Mono" },
  { id: "random", en: "Random", fr: "Aléatoire" },
];

const T = {
  open: { en: "Customize theme", fr: "Personnaliser le thème" },
  title: { en: "Theme customizer", fr: "Personnaliser le thème" },
  live: { en: "Live: the whole site recolours as you edit.", fr: "En direct : tout le site change pendant que vous éditez." },
  palette: { en: "Palette", fr: "Palette" },
  generate: { en: "Generate", fr: "Générer" },
  space: { en: "or press Space", fr: "ou appuyez sur Espace" },
  presets: { en: "Presets", fr: "Préréglages" },
  custom: { en: "Custom theme", fr: "Thème personnalisé" },
  contrast: { en: "Contrast", fr: "Contraste" },
  preview: { en: "Preview", fr: "Aperçu" },
  saved: { en: "Saved themes", fr: "Thèmes enregistrés" },
  save: { en: "Save theme", fr: "Enregistrer" },
  none: { en: "Nothing saved yet.", fr: "Aucun thème enregistré." },
  reset: { en: "Reset to original", fr: "Revenir à l'original" },
  copyAll: { en: "Copy CSS", fr: "Copier le CSS" },
  copied: { en: "Copied", fr: "Copié" },
  close: { en: "Close", fr: "Fermer" },
  lock: { en: "Lock", fr: "Verrouiller" },
  unlock: { en: "Unlock", fr: "Déverrouiller" },
  pick: { en: "Pick colour", fr: "Choisir la couleur" },
  copyHex: { en: "Copy HEX", fr: "Copier le HEX" },
  restore: { en: "Apply", fr: "Appliquer" },
  remove: { en: "Delete", fr: "Supprimer" },
  textOnBg: { en: "Text on background", fr: "Texte sur fond" },
  btn: { en: "Button label on accent", fr: "Texte sur bouton accent" },
  marks: { en: "Accent on background", fr: "Accent sur fond" },
};

/** HEX input with a local draft; commits only valid values. */
function HexField({ value, onCommit, label }: { value: string; onCommit: (v: string) => void; label: string }) {
  const [draft, setDraft] = useState(value);
  const valid = isHex(draft);
  return (
    <input
      aria-label={label}
      value={draft}
      spellCheck={false}
      maxLength={7}
      onChange={(e) => {
        setDraft(e.target.value);
        if (isHex(e.target.value) && e.target.value.replace("#", "").length === 6) onCommit(normalizeHex(e.target.value));
      }}
      onBlur={() => (valid ? onCommit(normalizeHex(draft)) : setDraft(value))}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="w-full border border-bone/20 bg-transparent px-1.5 py-1 text-center font-mono text-[11px] uppercase text-bone outline-none focus:border-accent"
      style={{ borderColor: valid ? undefined : "var(--c-accent)" }}
    />
  );
}

function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const I = {
  palette: "M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3ZM7.5 12.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
  lock: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z",
  unlock: "M7 11V7a5 5 0 0 1 9.9-1M5 11h14v10H5z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  close: "M6 6l12 12M18 6 6 18",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8",
  reset: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  save: "M5 3h11l3 3v15H5zM8 3v6h8M8 21v-7h8v7",
};

export default function ThemeCustomizer() {
  const { locale } = useContent();
  const l = (k: keyof typeof T) => T[k][locale];
  const theme = useTheme();
  const { palette, locks, presetId } = theme;
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<HarmonyMode>("complementary");
  const [copied, setCopied] = useState<string | null>(null);
  const [name, setName] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1400);
    } catch {}
  };

  // Keyboard: Esc closes; Space generates (like Coolors) when not typing.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.code === "Space" && tag !== "INPUT" && tag !== "BUTTON" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        theme.generate(mode);
      }
    };
    window.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
    };
  }, [open, mode, theme]);

  const ratios = [
    { label: l("textOnBg"), r: contrast(palette.paper, palette.ink) },
    { label: l("btn"), r: contrast(palette.paper, palette.accent) },
    { label: l("marks"), r: contrast(palette.accent, palette.ink) },
  ];
  const css = COLOR_KEYS.map((k) => `--c-${k}: ${palette[k]};`).join("\n");

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="theme-panel"
        aria-label={l("open")}
        title={l("open")}
        className="group fixed bottom-5 left-5 z-[155] flex items-center gap-2 rounded-full border border-bone/25 bg-surface px-3 py-2.5 text-bone shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-transform hover:scale-105"
      >
        <span className="flex -space-x-1.5" aria-hidden>
          {(["ink", "paper", "accent"] as ColorKey[]).map((k) => (
            <span key={k} className="h-4 w-4 rounded-full border border-bone/40" style={{ background: `var(--c-${k})` }} />
          ))}
        </span>
        <span className="mono hidden text-[10px] sm:inline">{locale === "fr" ? "Thème" : "Theme"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="theme-panel"
            ref={panel}
            role="dialog"
            aria-label={l("title")}
            className="fixed inset-x-0 bottom-0 z-[156] max-h-[86svh] overflow-y-auto border-t border-bone/15 bg-surface text-bone shadow-[0_-20px_60px_rgba(0,0,0,0.5)] md:inset-x-auto md:bottom-4 md:left-4 md:top-4 md:max-h-none md:w-[440px] md:border"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, x: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-bone/15 bg-surface px-5 py-4">
              <div>
                <p className="cut text-3xl">{l("title")}</p>
                <p className="mono mt-1 text-[10px] text-muted">
                  <span className="rec text-accent">●</span> {l("live")}
                </p>
              </div>
              <button type="button" data-autofocus onClick={() => (setOpen(false), trigger.current?.focus())} aria-label={l("close")} className="mt-1 p-1 hover:text-accent">
                <Icon d={I.close} size={18} />
              </button>
            </div>

            <div className="space-y-7 px-5 py-5">
              {/* Palette (Coolors-style columns) */}
              <section aria-label={l("palette")}>
                <p className="mono mb-3 text-[10px] text-muted">{l("palette")}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {COLOR_KEYS.map((k) => {
                    const hex = palette[k];
                    const role = ROLE_LABEL[k];
                    const fgOn = contrast(hex, "#ffffff") > contrast(hex, "#000000") ? "#ffffff" : "#000000";
                    return (
                      <div key={k} className="flex flex-col gap-1.5">
                        <label className="relative block h-24 cursor-pointer border border-bone/15 transition-colors duration-500" style={{ background: hex }} title={`${role[locale]} — ${role.hint[locale]}`}>
                          <span className="sr-only">
                            {l("pick")}: {role[locale]}
                          </span>
                          <input type="color" value={hex} onChange={(e) => theme.setColor(k, e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                          {locks[k] && (
                            <span className="absolute right-1 top-1" style={{ color: fgOn }} aria-hidden>
                              <Icon d={I.lock} size={12} />
                            </span>
                          )}
                        </label>
                        <p className="mono truncate text-center text-[9px]" title={role.hint[locale]}>
                          {role[locale]}
                        </p>
                        <HexField key={hex} value={hex} label={`${role[locale]} HEX`} onCommit={(v) => theme.setColor(k, v)} />
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => theme.toggleLock(k)}
                            aria-pressed={locks[k]}
                            aria-label={`${locks[k] ? l("unlock") : l("lock")} ${role[locale]}`}
                            title={locks[k] ? l("unlock") : l("lock")}
                            className="p-1 transition-colors hover:text-accent"
                            style={{ color: locks[k] ? "var(--c-accent)" : undefined }}
                          >
                            <Icon d={locks[k] ? I.lock : I.unlock} size={13} />
                          </button>
                          <button type="button" onClick={() => copy(hex.toUpperCase(), k)} aria-label={`${l("copyHex")} ${role[locale]}`} title={l("copyHex")} className="p-1 hover:text-accent">
                            {copied === k ? <span className="mono text-[9px] text-accent">✓</span> : <Icon d={I.copy} size={13} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Generate */}
              <section aria-label={l("generate")}>
                <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Harmony">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={mode === m.id}
                      onClick={() => setMode(m.id)}
                      className="mono border px-2.5 py-1.5 text-[10px] transition-colors"
                      style={{ borderColor: mode === m.id ? "var(--c-accent)" : "color-mix(in oklab, var(--c-paper) 20%, transparent)", background: mode === m.id ? "var(--c-accent)" : "transparent" }}
                    >
                      {m[locale]}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" onClick={() => theme.generate(mode)} className="btn btn--red !py-3">
                    <Icon d={I.spark} /> {l("generate")}
                  </button>
                  <span className="mono text-[10px] text-muted">{l("space")}</span>
                </div>
              </section>

              {/* Presets */}
              <section aria-label={l("presets")}>
                <p className="mono mb-3 text-[10px] text-muted">{l("presets")}</p>
                <ul className="space-y-1.5">
                  {PRESETS.map((p) => {
                    const active = presetId === p.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => theme.applyPreset(p.id)}
                          aria-pressed={active}
                          className="flex w-full items-center justify-between gap-3 border px-3 py-2 text-left text-sm transition-colors hover:border-accent"
                          style={{ borderColor: active ? "var(--c-accent)" : "color-mix(in oklab, var(--c-paper) 15%, transparent)" }}
                        >
                          <span className="font-semibold">{p.name[locale]}</span>
                          <span className="flex" aria-hidden>
                            {COLOR_KEYS.map((k) => (
                              <span key={k} className="h-5 w-5" style={{ background: p.palette[k] }} />
                            ))}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {presetId === "custom" && (
                    <li className="flex items-center justify-between gap-3 border border-accent px-3 py-2 text-sm">
                      <span className="font-semibold">{l("custom")}</span>
                      <span className="mono text-[10px] text-accent">●</span>
                    </li>
                  )}
                </ul>
              </section>

              {/* Contrast */}
              <section aria-label={l("contrast")}>
                <p className="mono mb-3 text-[10px] text-muted">{l("contrast")} · WCAG</p>
                <ul className="space-y-1.5">
                  {ratios.map((r) => {
                    const g = wcag(r.r);
                    return (
                      <li key={r.label} className="flex items-center justify-between border-b border-bone/10 pb-1.5 text-sm">
                        <span>{r.label}</span>
                        <span className="mono text-[10px]">
                          {r.r.toFixed(2)} : 1 <span className="ml-2 px-1.5 py-0.5" style={{ background: g === "Fail" ? "var(--c-accent)" : "color-mix(in oklab, var(--c-paper) 15%, transparent)" }}>{g}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Live preview */}
              <section aria-label={l("preview")}>
                <p className="mono mb-3 text-[10px] text-muted">{l("preview")}</p>
                <div className="grid grid-cols-2 border border-bone/15 text-[10px]" aria-hidden>
                  <div className="space-y-2 bg-[var(--c-ink)] p-3 text-[var(--c-paper)]">
                    <div className="flex justify-between">
                      <span className="cut text-sm">A.A.</span>
                      <span className="mono text-[8px] opacity-60">MENU</span>
                    </div>
                    <p className="cut text-2xl leading-none">
                      AHMED <span className="text-[var(--c-accent)]">A.</span>
                    </p>
                    <p className="opacity-70">Senior Full-Stack Developer</p>
                    <span className="inline-block rounded-full bg-[var(--c-accent)] px-2 py-1 text-[8px] font-bold uppercase text-[var(--c-paper)]">See the work</span>
                    <div className="border border-[color-mix(in_oklab,var(--c-paper)_20%,transparent)] bg-[var(--c-surface)] p-2">
                      <span className="mono text-[8px] text-[var(--c-accent)]">01 · Lines Up</span>
                      <div className="mt-1 h-6 bg-[color-mix(in_oklab,var(--c-paper)_12%,transparent)]" />
                    </div>
                  </div>
                  <div className="space-y-2 bg-[var(--c-paper)] p-3 text-[var(--c-ink)]">
                    <span className="mono text-[8px] text-[var(--c-accent)]">SC.02 — ABOUT</span>
                    <p className="text-sm font-semibold leading-tight">
                      One developer, <em className="serif-i text-[var(--c-accent)]">the whole stack.</em>
                    </p>
                    <p className="text-[var(--c-muted)]">Secondary text</p>
                    <div className="h-px bg-[var(--c-accent)]" />
                    <span className="inline-block rounded-full border border-[var(--c-ink)] px-2 py-1 text-[8px] font-bold uppercase">Case study →</span>
                  </div>
                </div>
              </section>

              {/* Saved themes */}
              <section aria-label={l("saved")}>
                <p className="mono mb-3 text-[10px] text-muted">{l("saved")}</p>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    theme.save(name);
                    setName("");
                  }}
                >
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`Theme ${theme.saved.length + 1}`}
                    aria-label={l("save")}
                    className="min-w-0 flex-1 border border-bone/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <button type="submit" className="btn !px-4 !py-2">
                    <Icon d={I.save} /> {l("save")}
                  </button>
                </form>
                <ul className="mt-3 space-y-1.5">
                  {theme.saved.length === 0 && <li className="text-sm text-muted">{l("none")}</li>}
                  {theme.saved.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 border border-bone/15 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 truncate">
                        <span className="flex shrink-0" aria-hidden>
                          {COLOR_KEYS.map((k) => (
                            <span key={k} className="h-4 w-4" style={{ background: s.palette[k] }} />
                          ))}
                        </span>
                        <span className="truncate">{s.name}</span>
                      </span>
                      <span className="flex shrink-0 gap-3">
                        <button type="button" onClick={() => theme.restore(s.id)} className="mono text-[10px] hover:text-accent">
                          {l("restore")}
                        </button>
                        <button type="button" onClick={() => theme.remove(s.id)} className="mono text-[10px] text-muted hover:text-accent" aria-label={`${l("remove")} ${s.name}`}>
                          ✕
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Footer actions */}
              <div className="flex flex-wrap gap-2 border-t border-bone/15 pt-5">
                <button type="button" onClick={theme.reset} disabled={theme.isOriginal} className="btn !px-4 !py-2 disabled:opacity-40">
                  <Icon d={I.reset} /> {l("reset")}
                </button>
                <button type="button" onClick={() => copy(css, "css")} className="btn !px-4 !py-2">
                  <Icon d={I.copy} /> {copied === "css" ? l("copied") : l("copyAll")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
