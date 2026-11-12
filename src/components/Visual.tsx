import Image from "next/image";
import type { Content, Project } from "@/content/types";
import Motif from "./Motif";

/**
 * A project's image in a viewfinder frame. Real screenshots are graded to
 * monochrome to sit in the palette and develop to full colour on hover/focus
 * (data-develop); projects without public screenshots use a labelled illustration.
 */
export default function Visual({
  project,
  labels,
  priority,
  sizes = "(min-width: 1024px) 60vw, 100vw",
  caption = true,
  ratio = "aspect-[16/10]",
}: {
  project: Project;
  labels: Content["ui"]["visual"];
  priority?: boolean;
  sizes?: string;
  caption?: boolean;
  ratio?: string;
}) {
  return (
    <figure className="group/visual">
      <div className="viewfinder">
        <span className="tick tick--tl" />
        <span className="tick tick--tr" />
        <span className="tick tick--bl" />
        <span className="tick tick--br" />
        <div className={`relative ${ratio} overflow-hidden bg-charcoal`} data-visual>
          <div className="absolute inset-[-5%]" data-visual-inner>
            {project.image ? (
              <Image
                src={project.image.src}
                alt={project.image.alt}
                fill
                priority={priority}
                sizes={sizes}
                className="object-cover object-top transition-transform duration-700 group-hover/visual:scale-[1.03]"
              />
            ) : (
              <Motif type={project.motif} className="h-full w-full" />
            )}
          </div>
        </div>
      </div>
      {caption && (
        <figcaption className="mono mt-4 flex justify-between gap-4 opacity-60">
          <span>{project.image ? project.image.note ?? labels.screenshot : labels.illustration}</span>
          <span>
            {labels.fig} {project.index}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
