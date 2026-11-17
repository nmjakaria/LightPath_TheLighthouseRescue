import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  eyebrow?: string;
}

/* Panels use the 80%-opacity Midnight token from PRD §14.1. */
export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(
  { title, eyebrow, className, children, ...rest },
  ref,
) {
  return (
    <section
      {...rest}
      ref={ref}
      className={cn("rounded-card border border-navy-line bg-midnight/80 p-4 backdrop-blur-sm", className)}
    >
      {eyebrow && <p className="font-mono text-xs uppercase tracking-widest text-cyan-beam">{eyebrow}</p>}
      {title !== undefined && <h2 className="mb-3 font-display text-2xl font-semibold text-beam-core">{title}</h2>}
      <div className="text-base text-soft-white">{children}</div>
    </section>
  );
});
