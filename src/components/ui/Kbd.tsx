import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

export type KbdProps = HTMLAttributes<HTMLElement>;

export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd({ className, children, ...rest }, ref) {
  return (
    <kbd
      {...rest}
      ref={ref}
      className={cn(
        "inline-flex min-w-6 items-center justify-center rounded-button border border-navy-line bg-deep-navy px-2 py-1 font-mono text-xs text-mist",
        className,
      )}
    >
      {children}
    </kbd>
  );
});
