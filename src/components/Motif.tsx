import type { Project } from "@/content/types";

const BONE = "#f2ede3";
const DIM = "rgba(242,237,227,0.3)";
const SOFT = "rgba(242,237,227,0.1)";
const RED = "#b3261e";

/**
 * Abstract animated drawings for projects with no public screenshots, drawn in
 * the three-colour palette. Labelled as illustrations; never fake product UI.
 */
export default function Motif({ type, className }: { type: Project["motif"]; className?: string }) {
  return (
    <svg viewBox="0 0 800 500" className={className} role="img" aria-label="Illustration">
      <rect width="800" height="500" fill="#1c1c1c" />
      {type === "timeline" && (
        <g>
          {[
            [60, 180, 300, 120],
            [140, 120, 420, 160],
            [80, 260, 380, 90],
            [200, 140, 520, 110],
          ].map(([a, aw, b, bw], i) => (
            <g key={i} className="m-drift" style={{ animationDelay: `${i * -1.3}s` }}>
              <rect x="40" y={120 + i * 70} width="720" height="44" fill={SOFT} />
              <rect x={a} y={124 + i * 70} width={aw} height="36" fill={i === 1 ? RED : DIM} />
              <rect x={b} y={124 + i * 70} width={bw} height="36" fill={SOFT} />
            </g>
          ))}
          <g className="m-play">
            <line x1="0" y1="96" x2="0" y2="420" stroke={RED} strokeWidth="2" />
          </g>
          <text x="40" y="70" fill={BONE} fontFamily="monospace" fontSize="15" letterSpacing="2">00:00:12:08 · 4 TRACKS · 60 FPS</text>
        </g>
      )}
      {type === "signal" && (
        <g fill="none">
          {[
            [44, 0.02, 0, 220, RED, 2.5],
            [28, 0.03, 1, 260, DIM, 1.5],
            [18, 0.045, 2, 300, SOFT, 1],
          ].map(([amp, f, ph, y, c, w], i) => {
            let d = "";
            for (let x = 0; x <= 800; x += 10) d += `${x === 0 ? "M" : "L"}${x} ${((y as number) + Math.sin(x * (f as number) + (ph as number)) * (amp as number)).toFixed(1)} `;
            return <path key={i} d={d} stroke={c as string} strokeWidth={w as number} className="m-flow" style={{ animationDelay: `${-i * 2}s` }} />;
          })}
          <text x="40" y="440" fill={BONE} fontFamily="monospace" fontSize="15" letterSpacing="2">10,000+ CONCURRENT · LIVE</text>
          <circle cx="760" cy="435" r="6" fill={RED} className="m-blink" />
        </g>
      )}
      {type === "pulse" && (
        <g>
          <path d="M40 160 H250 l20 -60 l25 120 l20 -90 l18 30 H520 l18 -40 l22 80 l16 -40 H760" fill="none" stroke={RED} strokeWidth="2.5" className="m-trace" />
          {Array.from({ length: 21 }, (_, d) => {
            const booked = [2, 5, 6, 9, 13, 16, 17].includes(d);
            return <rect key={d} x={40 + (d % 7) * 104} y={270 + Math.floor(d / 7) * 64} width="92" height="52" fill={booked ? "rgba(179,38,30,0.6)" : SOFT} stroke={booked ? RED : "none"} />;
          })}
        </g>
      )}
      {type === "bars" && (
        <g>
          {[120, 190, 150, 260, 210, 300, 240, 330, 280].map((v, i) => (
            <rect key={i} x={60 + i * 78} y={420 - v} width="46" height={v} fill={i === 7 ? RED : DIM} className="m-rise" style={{ animationDelay: `${i * 0.12}s`, transformOrigin: "0 420px" }} />
          ))}
          <line x1="40" y1="420" x2="760" y2="420" stroke={DIM} />
          <text x="60" y="70" fill={BONE} fontFamily="monospace" fontSize="15" letterSpacing="2">CO₂ · MARKET · FILTER · CSV / PDF</text>
        </g>
      )}
      {type === "document" && (
        <g>
          <rect x="220" y="50" width="360" height="400" fill={SOFT} stroke={DIM} />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x="250" y={90 + i * 24} width={i % 4 === 3 ? 180 : 300} height="7" fill={DIM} />
          ))}
          <rect x="244" y="0" width="312" height="22" fill="rgba(179,38,30,0.45)" className="m-scan" />
          <rect x="560" y="330" width="130" height="96" fill="#1c1c1c" stroke={RED} />
          <path d="M600 330 v-24 a25 25 0 0 1 50 0 v24" fill="none" stroke={RED} strokeWidth="3" />
          <text x="593" y="386" fill={BONE} fontFamily="monospace" fontSize="16" letterSpacing="2">RBAC</text>
        </g>
      )}
      {type === "grid" && (
        <g>
          {Array.from({ length: 48 }, (_, i) => (
            <circle key={i} cx={90 + (i % 12) * 56} cy={130 + Math.floor(i / 12) * 72} r="16" fill={i % 7 === 3 ? RED : DIM} className="m-blink" style={{ animationDelay: `${(i * 0.37) % 3}s` }} />
          ))}
        </g>
      )}
      {type === "layers" && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={180 + i * 60} y={80 + i * 50} width="320" height="200" fill={i === 3 ? "rgba(179,38,30,0.35)" : SOFT} stroke={i === 3 ? RED : DIM} className="m-float" style={{ animationDelay: `${i * -0.8}s` }} />
          ))}
          <text x="40" y="465" fill={BONE} fontFamily="monospace" fontSize="15" letterSpacing="2">LAYERS → TOKENS → &lt;Component /&gt;</text>
        </g>
      )}
    </svg>
  );
}
