"use client";

import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  { label, children, side = "top", className, ...rest },
  ref,
) {
  const id = useId();
  return (
    <span {...rest} ref={ref} aria-describedby={id} className={cn("group relative inline-flex", className)}>
      {children}
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-button border border-navy-line bg-midnight px-2 py-1 text-xs text-soft-white opacity-0 transition-opacity motion-reduce:transition-none group-hover:opacity-100 group-focus-within:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {label}
      </span>
    </span>
  );
});
