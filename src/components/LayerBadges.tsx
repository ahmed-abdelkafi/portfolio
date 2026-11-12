import { LAYERS, layerName, layersOf } from "@/content/architecture";
import type { Locale } from "@/content/types";

/** Five layer marks; the ones Ahmed built on this project are filled red. */
export default function LayerBadges({ slug, locale }: { slug: string; locale: Locale }) {
  const own = layersOf(slug);
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={locale === "fr" ? "Couches réalisées" : "Layers built"}>
      {LAYERS.map((l) => {
        const on = own.includes(l);
        return (
          <li
            key={l}
            className="mono border px-2 py-1 text-[10px]"
            style={{ borderColor: on ? "var(--red)" : "color-mix(in srgb, var(--fg) 25%, transparent)", background: on ? "var(--red)" : "transparent", color: on ? "var(--bone)" : undefined, opacity: on ? 1 : 0.5 }}
          >
            {on ? "■ " : "□ "}
            {layerName[l][locale]}
          </li>
        );
      })}
    </ul>
  );
}
