// Shared visual variants for Button and IconButton; colours come only from CSS-variable tokens.
import type { ButtonSize, ButtonVariant } from "./Button";

export const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-cyan-beam bg-cyan-beam text-abyss hover:border-beam-core hover:bg-beam-core",
  secondary: "border-navy-line bg-deep-navy text-soft-white hover:border-cyan-beam",
  ghost: "border-transparent bg-transparent text-soft-white hover:border-navy-line hover:bg-deep-navy",
  danger: "border-danger bg-danger text-abyss hover:border-light-red hover:bg-light-red",
};

export const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-lg",
};
