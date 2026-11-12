import Image from "next/image";
import type { Content, Project } from "@/content/types";
import Visual from "./Visual";

/**
 * Device mock-up for a project with real captures: the desktop capture in a
 * browser window (address bar shows the live URL) and the mobile capture in a
 * phone frame overlapping it. Full colour. Theme-aware chrome (CSS variables).
 * Falls back to <Visual/> (labelled illustration) when there is no capture.
 */
export default function Showcase({
  project,
  labels,
  priority,
  sizes = "(min-width: 1024px) 55vw, 100vw",
  caption = true,
  phone = true,
}: {
  project: Project;
  labels: Content["ui"]["visual"];
  priority?: boolean;
  sizes?: string;
  caption?: boolean;
  phone?: boolean;
}) {
  const img = project.image;
  if (!img) return <Visual project={project} labels={labels} priority={priority} sizes={sizes} caption={caption} />;
  const host = project.live?.label ?? project.name;

  return (
    <figure className={phone && img.mobile ? "pb-[9%] pr-[7%]" : undefined}>
      <div className="relative">
        {/* Browser window */}
        <div className="overflow-hidden rounded-[10px] border border-[color-mix(in_oklab,var(--c-paper)_16%,transparent)] bg-surface shadow-[0_30px_70px_rgba(0,0,0,0.35)]" data-visual>
          <div className="flex items-center gap-3 border-b border-[color-mix(in_oklab,var(--c-paper)_12%,transparent)] px-3 py-2" aria-hidden>
            <span className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-[color-mix(in_oklab,var(--c-paper)_28%,transparent)]" />
              ))}
            </span>
            <span className="mono mx-auto flex max-w-[70%] items-center gap-1.5 truncate rounded-full bg-[color-mix(in_oklab,var(--c-paper)_8%,transparent)] px-3 py-1 text-[9px] normal-case tracking-normal text-bone/70">
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />
              </svg>
              {host}
            </span>
            <span className="w-8" />
          </div>
          <div className="relative aspect-[16/10] overflow-hidden">
            <div className="absolute inset-0">
              <Image src={img.src} alt={img.alt} fill priority={priority} sizes={sizes} className="object-cover object-top" />
            </div>
          </div>
        </div>

        {/* Phone */}
        {phone && img.mobile && (
          <div className="absolute -bottom-[9%] -right-[7%] w-[23%] min-w-[92px]" aria-hidden>
            <div className="rounded-[22%/10.5%] border-[5px] border-[color-mix(in_oklab,var(--c-ink)_80%,var(--c-paper))] bg-[var(--c-ink)] p-[3%] shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
              <div className="relative aspect-[390/844] overflow-hidden rounded-[18%/8.5%]">
                <Image src={img.mobile} alt="" fill sizes="(min-width: 1024px) 14vw, 25vw" className="object-cover object-top" />
                <span className="absolute left-1/2 top-[1.6%] h-[2.6%] w-[30%] -translate-x-1/2 rounded-full bg-black/85" />
              </div>
            </div>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mono mt-4 flex justify-between gap-4 opacity-60">
          <span>{img.note ?? labels.screenshot}</span>
          <span>
            {labels.fig} {project.index}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
