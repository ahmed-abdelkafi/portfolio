/**
 * FINAL CUT — scene helpers. Colours live in the theme system
 * (src/lib/themes.ts + CSS variables in globals.css), never here.
 */
export type Scene = "dark" | "light";

/** Scene numbers used across the page, like a shooting script. */
export const sceneNo = (n: number) => `SC.${String(n).padStart(2, "0")}`;

/** Timecode derived from a 0–1 scroll progress value. */
export const timecode = (progress: number, totalSeconds = 120) => {
  const t = Math.max(0, Math.min(1, progress)) * totalSeconds;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const f = Math.floor((t % 1) * 24);
  return `00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};
