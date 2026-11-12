"use client";

import { createContext, useContext } from "react";
import type { Content } from "@/content/types";

const Ctx = createContext<Content | null>(null);

export default function ContentProvider({ value, children }: { value: Content; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContent(): Content {
  const c = useContext(Ctx);
  if (!c) throw new Error("useContent must be used inside ContentProvider");
  return c;
}

