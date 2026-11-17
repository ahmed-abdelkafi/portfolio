/** Normalise a referrer (+ optional UTM tags) into source / medium / campaign. */

const SEARCH: [RegExp, string][] = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)search\.yahoo\.com$|(^|\.)yahoo\.com$/, "Yahoo"],
  [/(^|\.)yandex\./, "Yandex"],
  [/(^|\.)baidu\.com$/, "Baidu"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)qwant\.com$/, "Qwant"],
  [/(^|\.)search\.brave\.com$/, "Brave Search"],
  [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "ChatGPT"],
];

const SOCIAL: [RegExp, string][] = [
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/(^|\.)github\.com$/, "GitHub"],
  [/(^|\.)facebook\.com$|^fb\.me$|(^|\.)messenger\.com$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)twitter\.com$|^t\.co$|(^|\.)x\.com$/, "X (Twitter)"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/(^|\.)whatsapp\.com$|^wa\.me$/, "WhatsApp"],
  [/(^|\.)t\.me$|(^|\.)telegram\.org$/, "Telegram"],
  [/(^|\.)malt\.(fr|com)$/, "Malt"],
  [/(^|\.)devfolio\.co$/, "Devfolio"],
];

const clean = (v: unknown, max = 80) =>
  typeof v === "string" ? v.trim().toLowerCase().replace(/[^a-z0-9 ._\-+/]/g, "").slice(0, max) || null : null;

export function classifySource(refHost: string | null, utm: { source?: unknown; medium?: unknown; campaign?: unknown } = {}) {
  const uSource = clean(utm.source);
  const uMedium = clean(utm.medium);
  const campaign = clean(utm.campaign);

  if (uSource) {
    const known = [...SEARCH, ...SOCIAL].find(([re]) => re.test(`${uSource}.com`) || re.test(uSource));
    return { source: known ? known[1] : uSource, medium: uMedium ?? "campaign", campaign };
  }
  if (!refHost) return { source: "Direct", medium: "none", campaign };
  for (const [re, name] of SEARCH) if (re.test(refHost)) return { source: name, medium: "organic", campaign };
  for (const [re, name] of SOCIAL) if (re.test(refHost)) return { source: name, medium: "social", campaign };
  return { source: refHost, medium: "referral", campaign };
}
