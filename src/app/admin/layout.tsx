import type { Metadata, Viewport } from "next";
import "./admin.css";
import { fontVars } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { default: "Control Room · Ahmed Abdelkafi", template: "%s · Control Room" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const viewport: Viewport = { themeColor: "#1c1c1c", width: "device-width", initialScale: 1 };

/** Private analytics application. Separate root layout: none of the portfolio's scripts load here. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
