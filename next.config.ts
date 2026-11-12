import type { NextConfig } from "next";

/**
 * The whole site is static, so it is exported to plain HTML/CSS/JS (`out/`)
 * and served by Cloudflare Workers static assets (see wrangler.jsonc).
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
  experimental: { globalNotFound: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
