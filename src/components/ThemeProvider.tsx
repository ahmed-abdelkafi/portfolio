"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  COLOR_KEYS,
  ORIGINAL,
  PRESETS,
  SAVED_KEY,
  STORAGE_KEY,
  generatePalette,
  isHex,
  normalizeHex,
  paletteToCss,
  samePalette,
  type ColorKey,
  type HarmonyMode,
  type Locks,
  type Palette,
} from "@/lib/themes";

export type SavedTheme = { id: string; name: string; palette: Palette };

type ThemeCtx = {
  palette: Palette;
  presetId: string; // a preset id or "custom"
  locks: Locks;
  saved: SavedTheme[];
  isOriginal: boolean;
  setColor: (key: ColorKey, hex: string) => void;
  applyPreset: (id: string) => void;
  toggleLock: (key: ColorKey) => void;
  generate: (mode: HarmonyMode) => void;
  reset: () => void;
  save: (name?: string) => void;
  restore: (id: string) => void;
  remove: (id: string) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);
const NO_LOCKS: Locks = { ink: false, surface: false, paper: false, muted: false, accent: false };

const validPalette = (p: unknown): p is Palette =>
  !!p && typeof p === "object" && COLOR_KEYS.every((k) => typeof (p as Palette)[k] === "string" && isHex((p as Palette)[k]));

/**
 * Single source of truth for the live theme. The palette is applied through a
 * React-rendered <style> (CSS custom properties), persisted in localStorage,
 * and every component reads semantic variables, so the site recolours live.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPalette] = useState<Palette>(ORIGINAL);
  const [presetId, setPresetId] = useState("original");
  const [locks, setLocks] = useState<Locks>(NO_LOCKS);
  const [saved, setSaved] = useState<SavedTheme[]>([]);
  const [ready, setReady] = useState(false);

  // Restore after mount (the inline boot script already painted the saved colours).
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const t = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        if (t && validPalette(t.palette)) {
          setPalette(t.palette);
          setPresetId(typeof t.presetId === "string" ? t.presetId : "custom");
          if (t.locks) setLocks({ ...NO_LOCKS, ...t.locks });
        }
        const s = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
        if (Array.isArray(s)) setSaved(s.filter((x) => x && validPalette(x.palette)));
      } catch {}
      setReady(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Persist.
  useEffect(() => {
    if (!ready) return;
    try {
      if (samePalette(palette, ORIGINAL)) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify({ palette, presetId, locks }));
    } catch {}
  }, [palette, presetId, locks, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {}
  }, [saved, ready]);

  const setColor = useCallback((key: ColorKey, hex: string) => {
    if (!isHex(hex)) return;
    setPalette((p) => ({ ...p, [key]: normalizeHex(hex) }));
    setPresetId("custom");
  }, []);

  const applyPreset = useCallback((id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPalette(p.palette);
    setPresetId(id);
  }, []);

  const toggleLock = useCallback((key: ColorKey) => setLocks((l) => ({ ...l, [key]: !l[key] })), []);

  const generate = useCallback(
    (mode: HarmonyMode) => {
      setPalette((p) => generatePalette(mode, p, locks));
      setPresetId("custom");
    },
    [locks],
  );

  const reset = useCallback(() => {
    setPalette(ORIGINAL);
    setPresetId("original");
    setLocks(NO_LOCKS);
  }, []);

  const save = useCallback(
    (name?: string) =>
      setSaved((s) => [...s, { id: `t${Date.now()}`, name: name?.trim() || `Theme ${s.length + 1}`, palette }]),
    [palette],
  );

  const restore = useCallback(
    (id: string) => {
      const t = saved.find((x) => x.id === id);
      if (!t) return;
      setPalette(t.palette);
      setPresetId("custom");
    },
    [saved],
  );

  const remove = useCallback((id: string) => setSaved((s) => s.filter((x) => x.id !== id)), []);

  const value = useMemo<ThemeCtx>(
    () => ({ palette, presetId, locks, saved, isOriginal: samePalette(palette, ORIGINAL), setColor, applyPreset, toggleLock, generate, reset, save, restore, remove }),
    [palette, presetId, locks, saved, setColor, applyPreset, toggleLock, generate, reset, save, restore, remove],
  );

  return (
    <Ctx.Provider value={value}>
      {/* Rendered only once restored, so it never overrides the boot style with the default. */}
      {ready && <style data-theme-vars>{paletteToCss(palette)}</style>}
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
}

/** Inline script for <head>: paints a saved palette before first render (no flash). Hex-validated. */
export const themeBootScript = `(function(){try{var t=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'null');if(!t||!t.palette)return;var p=t.palette,k=['ink','surface','paper','muted','accent'],c='';for(var i=0;i<k.length;i++){var v=p[k[i]];if(!/^#[0-9a-fA-F]{6}$/.test(v))return;c+='--c-'+k[i]+':'+v+';'}var s=document.createElement('style');s.id='aa-theme-boot';s.textContent=':root{'+c+'}';document.head.appendChild(s)}catch(e){}})();`;
