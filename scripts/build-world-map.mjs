// One-off generator: country outlines (Natural Earth 1:110m) -> SVG path strings keyed by ISO alpha-2.
// Output: src/app/admin/_lib/world.json (static, so the dashboard ships no map library).
import { readFileSync, writeFileSync } from "node:fs";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countries from "i18n-iso-countries";

const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"));
const geo = feature(topo, topo.objects.countries);
const W = 960, H = 500;
const projection = geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], { type: "Sphere" });
const path = geoPath(projection);
const shapes = [];
for (const f of geo.features) {
  if (f.properties?.name === "Antarctica") continue;
  const a2 = countries.numericToAlpha2(String(f.id).padStart(3, "0"));
  const d = path(f);
  if (!d) continue;
  // Round coordinates to 1 decimal to keep the file small.
  shapes.push({ id: a2 ?? `N${f.id}`, name: f.properties?.name ?? "", d: d.replace(/(\d+\.\d)\d+/g, "$1") });
}
writeFileSync("src/app/admin/_lib/world.json", JSON.stringify({ width: W, height: H, sphere: path({ type: "Sphere" }).replace(/(\d+\.\d)\d+/g, "$1"), shapes }));
console.log(shapes.length, "countries");
