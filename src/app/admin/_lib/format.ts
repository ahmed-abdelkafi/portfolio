const nf = new Intl.NumberFormat("en-GB");
const nf1 = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

export const num = (n: number | null | undefined) => nf.format(Math.round(n ?? 0));
export const dec = (n: number | null | undefined) => nf1.format(n ?? 0);
export const pct = (n: number | null | undefined, digits = 1) => `${((n ?? 0) * 100).toFixed(digits)}%`;

export function duration(ms: number | null | undefined) {
  const s = Math.round((ms ?? 0) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** Relative change; null when there is no baseline to compare with. */
export const delta = (cur: number, prev: number) => (prev > 0 ? (cur - prev) / prev : cur > 0 ? null : 0);

export function countryName(code: string | null | undefined) {
  if (!code || code === "XX" || code === "T1") return code === "T1" ? "Tor network" : "Unknown";
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export const flag = (code: string | null | undefined) =>
  code && /^[A-Z]{2}$/i.test(code) && code !== "XX" && code !== "T1"
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : "·";

export const ago = (ts: number, now = Date.now()) => {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

const PROJECT_NAMES: Record<string, string> = {
  "lines-up": "Lines Up",
  qrbase: "QRBase",
  dinertia: "Dinertia",
  bitgrass: "Bitgrass",
  "legal-tech": "Legal-Tech",
  "survey-engine": "Survey Engine",
  videokit: "VideoKit",
};
export const projectName = (slug: string) => PROJECT_NAMES[slug] ?? slug;

export const EVENT_LABELS: Record<string, string> = {
  project_click: "Project clicks",
  case_study_view: "Case study views",
  contact_click: "Contact button",
  email_click: "Email link",
  phone_click: "Phone link",
  whatsapp_click: "WhatsApp",
  linkedin_click: "LinkedIn",
  github_click: "GitHub",
  live_site_click: "Live project sites",
  cv_download: "CV downloads",
  nav_click: "Navigation",
  theme_change: "Theme changes",
};

export const DEVICE_LABELS: Record<string, string> = { desktop: "Desktop", mobile: "Mobile", tablet: "Tablet", unknown: "Unknown" };
export const SCREEN_LABELS: Record<string, string> = {
  xs: "Phone (< 576 px)",
  sm: "Large phone (576–767)",
  md: "Tablet (768–1023)",
  lg: "Laptop (1024–1439)",
  xl: "Desktop (≥ 1440)",
  unknown: "Unknown",
};

/** Human label for a site path (e.g. /en/work/lines-up → "Lines Up · case study (EN)"). */
export function pageLabel(path: string) {
  const m = path.match(/^\/(en|fr)(?:\/(work)\/([a-z0-9-]+)|\/(privacy))?$/);
  if (!m) return path;
  const lang = m[1].toUpperCase();
  if (m[3]) return `${projectName(m[3])} · case study (${lang})`;
  if (m[4]) return `Privacy (${lang})`;
  return `Home (${lang})`;
}
