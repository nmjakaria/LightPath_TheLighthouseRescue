import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

type Gap = 1 | 2 | 3 | 4;
type Alignment = "start" | "center" | "end" | "stretch";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column";
  gap?: Gap;
  align?: Alignment;
  justify?: Alignment | "between";
  wrap?: boolean;
}

const gapClasses: Record<Gap, string> = { 1: "gap-2", 2: "gap-4", 3: "gap-6", 4: "gap-8" };
const alignClasses: Record<Alignment, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};
const justifyClasses: Record<Alignment | "between", string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  stretch: "justify-normal",
  between: "justify-between",
};

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = "column", gap = 2, align = "stretch", justify = "start", wrap = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      {...rest}
      ref={ref}
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && "flex-wrap",
        className,
      )}
    >
      {children}
    </div>
  );
});

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  children: ReactNode;
}

/* Section heading + description wrapper used by menus and the dev showcase. */
export function Section({ title, description, className, children, ...rest }: SectionProps) {
  return (
    <section {...rest} className={cn("space-y-3", className)}>
      <header>
        <h2 className="font-display text-2xl font-semibold text-beam-core">{title}</h2>
        {description && <p className="mt-1 text-sm text-mist">{description}</p>}
      </header>
      {children}
    </section>
  );
}
