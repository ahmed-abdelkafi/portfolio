"use client";

import { useState } from "react";
import { PRESETS, useRange } from "../_lib/range";

export default function DateFilter() {
  const r = useRange();
  const [from, setFrom] = useState(r.customFrom);
  const [to, setTo] = useState(r.customTo);
  const showCustom = r.preset === "custom";

  return (
    <div className="flex flex-col items-start gap-3 md:items-end">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Date range">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="chip" aria-pressed={r.preset === p.id} onClick={() => r.setPreset(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      {showCustom ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (from && to && from <= to) r.setCustom(from, to);
          }}
        >
          <label className="label" htmlFor="rf">
            From
          </label>
          <input id="rf" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mono rounded-sm border border-[var(--line-strong)] bg-transparent px-2 py-1 text-xs" />
          <label className="label" htmlFor="rt">
            To
          </label>
          <input id="rt" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="mono rounded-sm border border-[var(--line-strong)] bg-transparent px-2 py-1 text-xs" />
          <button type="submit" className="chip" aria-pressed="false">
            Apply
          </button>
        </form>
      ) : (
        <p className="label">{r.label} · compared with the previous period</p>
      )}
    </div>
  );
}
