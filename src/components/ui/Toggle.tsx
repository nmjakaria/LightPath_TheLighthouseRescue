"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export interface ToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "onClick" | "children"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, onCheckedChange, label, className, ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border p-0.5 transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-cyan-beam bg-cyan-beam" : "border-navy-line bg-deep-navy",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-6 w-6 rounded-full bg-abyss transition-transform motion-reduce:transition-none",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
});
