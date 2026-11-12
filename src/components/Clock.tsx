"use client";

import { useEffect, useState } from "react";

const format = () =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Tunis" }).format(new Date());

/** Live local time in Sfax. Renders a placeholder on the server to avoid hydration mismatch. */
export default function Clock({ className }: { className?: string }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setTime(format());
    const first = window.setTimeout(update, 0);
    const id = window.setInterval(update, 15_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return (
    <span className={className} suppressHydrationWarning>
      {time ?? "--:--"} UTC+1
    </span>
  );
}
