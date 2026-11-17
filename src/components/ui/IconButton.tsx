"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";
import type { ButtonSize, ButtonVariant } from "./Button";
import { variantClasses as buttonVariants, sizeClasses as buttonSizes } from "./buttonStyles";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = "secondary", size = "md", disabled, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-button border transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        "w-10 px-0",
        className,
      )}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
});
