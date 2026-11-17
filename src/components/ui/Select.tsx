"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "./cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: readonly SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, className, ...rest },
  ref,
) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-mist">
      <span>{label}</span>
      <select
        {...rest}
        ref={ref}
        className={cn(
          "h-10 rounded-button border border-navy-line bg-deep-navy px-3 text-base text-soft-white disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
});
