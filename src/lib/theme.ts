/**
 * FINAL CUT — the portfolio as an auteur film.
 * Exactly three colours: charcoal, bone and a restrained deep red.
 */
export const palette = {
  charcoal: "#1c1c1c",
  bone: "#f2ede3",
  red: "#b3261e",
} as const;

export type Scene = "dark" | "light";

export const scenes: Record<Scene, { bg: string; fg: string }> = {
  dark: { bg: palette.charcoal, fg: palette.bone },
  light: { bg: palette.bone, fg: palette.charcoal },
};

/** Scene numbers used across the page, like a shooting script. */
export const sceneNo = (n: number) => `SC.${String(n).padStart(2, "0")}`;

/** Fake-free timecode helper: frames are derived from a 0–1 progress value, not invented data. */
export const timecode = (progress: number, totalSeconds = 120) => {
  const t = Math.max(0, Math.min(1, progress)) * totalSeconds;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const f = Math.floor((t % 1) * 24);
  return `00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};
