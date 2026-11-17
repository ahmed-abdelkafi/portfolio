"use client";

import { useEffect, useState } from "react";
import { OPT_OUT_KEY } from "./Analytics";

/** Per-device opt-out of the site's audience measurement. */
export default function PrivacyControls({ locale }: { locale: "en" | "fr" }) {
  const [optedOut, setOptedOut] = useState<boolean | null>(null);
  const fr = locale === "fr";

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read a per-device flag after hydration
      setOptedOut(window.localStorage.getItem(OPT_OUT_KEY) === "1");
    } catch {
      setOptedOut(false);
    }
  }, []);

  const toggle = () => {
    const next = !optedOut;
    try {
      if (next) window.localStorage.setItem(OPT_OUT_KEY, "1");
      else window.localStorage.removeItem(OPT_OUT_KEY);
      setOptedOut(next);
    } catch {
      /* storage unavailable: nothing to toggle */
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-4 border-t hair pt-6 md:flex-row md:items-center md:justify-between">
      <p className="mono" aria-live="polite">
        {optedOut === null
          ? "…"
          : optedOut
            ? fr
              ? "Mesure d'audience désactivée sur cet appareil."
              : "Audience measurement is off on this device."
            : fr
              ? "Mesure d'audience active sur cet appareil."
              : "Audience measurement is on for this device."}
      </p>
      <button type="button" onClick={toggle} className="btn" disabled={optedOut === null} aria-pressed={optedOut ?? false}>
        {optedOut ? (fr ? "Réactiver la mesure" : "Turn measurement back on") : fr ? "Ne plus me compter" : "Don't count my visits"}
      </button>
    </div>
  );
}
