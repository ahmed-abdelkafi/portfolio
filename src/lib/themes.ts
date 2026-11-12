/**
 * Centralised theme system. Five editable base colours drive every semantic
 * role on the site (see globals.css: --c-* and the derived roles).
 * The default is Ahmed's signature identity: charcoal, bone, deep red.
 */

export type ColorKey = "ink" | "surface" | "paper" | "muted" | "accent";
export type Palette = Record<ColorKey, string>;
export type Locks = Record<ColorKey, boolean>;
export type HarmonyMode = "complementary" | "analogous" | "triadic" | "monochromatic" | "random";

export const COLOR_KEYS: ColorKey[] = ["ink", "surface", "paper", "muted", "accent"];

export const ROLE_LABEL: Record<ColorKey, { en: string; fr: string; hint: { en: string; fr: string } }> = {
  ink: { en: "Background", fr: "Fond", hint: { en: "Dark scenes · text on light", fr: "Scènes sombres · texte sur clair" } },
  surface: { en: "Surface", fr: "Surface", hint: { en: "Cards · editor · panels", fr: "Cartes · éditeur · panneaux" } },
  paper: { en: "Paper", fr: "Papier", hint: { en: "Light scenes · text on dark", fr: "Scènes claires · texte sur sombre" } },
  muted: { en: "Muted", fr: "Atténué", hint: { en: "Secondary text", fr: "Texte secondaire" } },
  accent: { en: "Accent", fr: "Accent", hint: { en: "Buttons · highlights · marks", fr: "Boutons · surlignages · marques" } },
};

/** Ahmed's identity. Surface and muted are derived supporting shades. */
export const ORIGINAL: Palette = {
  ink: "#1c1c1c",
  surface: "#262626",
  paper: "#f2ede3",
  muted: "#a39e95",
  accent: "#b3261e",
};

export type Preset = { id: string; name: { en: string; fr: string }; palette: Palette };

export const PRESETS: Preset[] = [
  { id: "original", name: { en: "Original Signature", fr: "Signature originale" }, palette: ORIGINAL },
  {
    id: "midnight",
    name: { en: "Midnight Editorial", fr: "Éditorial minuit" },
    palette: { ink: "#0f1424", surface: "#18203a", paper: "#ece9e1", muted: "#98a0b3", accent: "#ab3909" },
  },
  {
    id: "warm",
    name: { en: "Warm Minimal", fr: "Minimal chaleureux" },
    palette: { ink: "#2b2622", surface: "#36302a", paper: "#f6f1e7", muted: "#a89f92", accent: "#a0522d" },
  },
  {
    id: "mono",
    name: { en: "Modern Monochrome", fr: "Monochrome moderne" },
    palette: { ink: "#111111", surface: "#1d1d1d", paper: "#f4f4f2", muted: "#9b9b9b", accent: "#6b6b6b" },
  },
  {
    id: "burgundy",
    name: { en: "Contemporary Burgundy", fr: "Bordeaux contemporain" },
    palette: { ink: "#1a1416", surface: "#261d20", paper: "#f3ece6", muted: "#a6999a", accent: "#9b2d4e" },
  },
];

/* ───────────────────────── colour maths ───────────────────────── */

export const isHex = (v: string) => /^#?[0-9a-f]{6}$/i.test(v.trim()) || /^#?[0-9a-f]{3}$/i.test(v.trim());

export function normalizeHex(v: string): string {
  let h = v.trim().replace("#", "").toLowerCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return `#${h}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${toHex(f(0) * 255)}${toHex(f(8) * 255)}${toHex(f(4) * 255)}`;
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s * 100, l * 100];
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export const wcag = (ratio: number) => (ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA Large" : "Fail");

/* ───────────────────────── generation ───────────────────────── */

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Darken / lighten until a contrast target is met (keeps hue and saturation). */
function ensureContrast(color: string, against: string, target: number, direction: "darker" | "lighter") {
  const [h, s, l0] = hexToHsl(color);
  let l = l0;
  let out = color;
  for (let i = 0; i < 60 && contrast(out, against) < target; i++) {
    l = direction === "darker" ? l - 1.2 : l + 1.2;
    out = hslToHex(h, s, Math.max(2, Math.min(98, l)));
  }
  return out;
}

/**
 * Generates a harmonious, readable palette. Locked colours are kept; the
 * base hue comes from a locked accent or ink when available.
 */
export function generatePalette(mode: HarmonyMode, current: Palette, locks: Locks): Palette {
  const seed = locks.accent ? hexToHsl(current.accent)[0] : locks.ink ? hexToHsl(current.ink)[0] : rand(0, 360);
  const accentHue = {
    complementary: seed + 180,
    analogous: seed + 32,
    triadic: seed + 120,
    monochromatic: seed,
    random: rand(0, 360),
  }[mode];
  const inkHue = locks.accent ? accentHue + (mode === "monochromatic" ? 0 : 180) : seed;
  const sat = mode === "monochromatic" ? rand(8, 18) : rand(6, 22);

  const next: Palette = { ...current };
  if (!locks.ink) next.ink = hslToHex(inkHue, sat, rand(8, 13));
  if (!locks.surface) {
    const [h, s, l] = hexToHsl(next.ink);
    next.surface = hslToHex(h, s, l + rand(4, 7));
  }
  if (!locks.paper) next.paper = hslToHex(mode === "monochromatic" ? inkHue : inkHue + rand(-20, 20), rand(12, 32), rand(91, 95));
  if (!locks.muted) {
    const [h] = hexToHsl(next.paper);
    next.muted = hslToHex(h, rand(5, 12), rand(58, 66));
  }
  if (!locks.accent) {
    const s = mode === "monochromatic" ? rand(35, 55) : rand(55, 78);
    next.accent = hslToHex(accentHue, s, rand(38, 50));
  }
  // Readability guarantees (only adjust unlocked colours).
  if (!locks.paper && contrast(next.ink, next.paper) < 12) next.paper = ensureContrast(next.paper, next.ink, 12, "lighter");
  if (!locks.accent && contrast(next.accent, next.paper) < 4.5) next.accent = ensureContrast(next.accent, next.paper, 4.5, "darker");
  return next;
}

/** CSS custom properties for a palette (consumed by globals.css). */
export const paletteToCss = (p: Palette) =>
  `:root{--c-ink:${p.ink};--c-surface:${p.surface};--c-paper:${p.paper};--c-muted:${p.muted};--c-accent:${p.accent};}`;

export const samePalette = (a: Palette, b: Palette) => COLOR_KEYS.every((k) => a[k].toLowerCase() === b[k].toLowerCase());

export const STORAGE_KEY = "aa-theme";
export const SAVED_KEY = "aa-themes-saved";
