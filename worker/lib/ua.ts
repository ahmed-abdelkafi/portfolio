/** Tiny user-agent classifier: device category, OS family and browser family. No version, no fingerprint. */

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|discord|skype|slack|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python|httpclient|java\/|go-http|okhttp|axios|node-fetch|undici|postman|insomnia|scrapy|ahrefs|semrush|mj12|dotbot|petal|yandex|baidu|bytespider|gptbot|claudebot|anthropic|perplexity|ccbot|applebot|duckduck|preview/i;

export const isBot = (ua: string) => !ua || ua.length < 20 || BOT_RE.test(ua);

export function parseUA(ua: string) {
  const device = /ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i.test(ua)
    ? "tablet"
    : /mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/i.test(ua)
      ? "mobile"
      : "desktop";

  const os = /windows nt/i.test(ua)
    ? "Windows"
    : /iphone|ipad|ipod/i.test(ua)
      ? "iOS"
      : /android/i.test(ua)
        ? "Android"
        : /mac os x|macintosh/i.test(ua)
          ? "macOS"
          : /cros/i.test(ua)
            ? "ChromeOS"
            : /linux/i.test(ua)
              ? "Linux"
              : "Other";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /firefox|fxios/i.test(ua)
          ? "Firefox"
          : /crios|chrome|chromium/i.test(ua)
            ? "Chrome"
            : /safari/i.test(ua)
              ? "Safari"
              : "Other";

  return { device, os, browser };
}

export const screenBucket = (w: number) => (w < 576 ? "xs" : w < 768 ? "sm" : w < 1024 ? "md" : w < 1440 ? "lg" : "xl");
