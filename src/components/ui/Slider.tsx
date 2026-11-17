"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  valueLabel?: ReactNode;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { label, valueLabel, className, value, ...rest },
  ref,
) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-mist">
      <span className="flex items-center justify-between gap-4">
        <span>{label}</span>
        <span className="font-mono text-soft-white">{valueLabel ?? value}</span>
      </span>
      <input
        {...rest}
        ref={ref}
        type="range"
        value={value}
        className={cn(
          "h-2 w-full cursor-pointer accent-cyan-beam disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />
    </label>
  );
});
