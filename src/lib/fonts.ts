import { Archivo, Bodoni_Moda, JetBrains_Mono } from "next/font/google";

/** Swiss grotesk with a width axis: condensed for oversized titles, wide for scroll-driven typography. */
export const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-sans-face", display: "swap" });

/** High-contrast didone for editorial italics. */
export const serif = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-serif-face", display: "swap" });

/** Timecodes, scene numbers and labels. */
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap" });

export const fontVars = `${sans.variable} ${serif.variable} ${mono.variable}`;
