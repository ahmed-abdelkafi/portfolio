import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { fontVars } from "@/lib/fonts";

export const metadata: Metadata = { title: "404 · Ahmed Abdelkafi", robots: { index: false } };

/** Bilingual 404 for any unmatched URL. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVars}>
      <body>
        <main id="main" className="grid min-h-[100svh] place-items-center px-4 text-center">
          <div>
            <p className="mono text-red">Scene missing · Scène introuvable</p>
            <h1 className="cut mt-6 text-[clamp(120px,30vw,480px)]">404</h1>
            <p className="serif-i mt-2 text-3xl">This shot didn&apos;t make the final cut.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/en" className="btn">
                Back to the film
              </Link>
              <Link href="/fr" className="btn" lang="fr">
                Retour au film
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
