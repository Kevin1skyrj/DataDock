import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A landing section's opening block: eyebrow, title, lead.
 *
 * Extracted now that a second section needs the same three-part structure and
 * the same type ramp. Deliberately not configurable beyond its content — no
 * alignment or size props until a section actually asks for something other
 * than centred, at which point the difference will be a real one rather than a
 * guess about what might vary.
 *
 * `data-section-heading` is the animation hook: a section's entrance staggers
 * `[data-section-heading] > *` without needing to know what is inside.
 */
export function SectionHeading({ eyebrow, title, description, className, ...props }) {
  return (
    <div
      data-section-heading
      className={cn("mx-auto flex max-w-2xl flex-col items-center text-center", className)}
      {...props}
    >
      {eyebrow ? (
        <Badge variant="neutral" pill size="md" className="tracking-wider uppercase">
          {eyebrow}
        </Badge>
      ) : null}

      <h2 className="mt-5 text-display-md font-semibold tracking-tighter text-balance sm:text-display-lg lg:text-display-xl">
        {title}
      </h2>

      {description ? (
        <p className="mt-4 text-lg leading-[1.6] text-muted-foreground text-balance sm:text-2xl">
          {description}
        </p>
      ) : null}
    </div>
  );
}
