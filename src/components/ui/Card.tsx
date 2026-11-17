import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  footer?: ReactNode;
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { title, footer, interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      {...rest}
      ref={ref}
      className={cn(
        "rounded-card border border-navy-line bg-deep-navy p-4",
        interactive && "transition-colors motion-reduce:transition-none hover:border-cyan-beam",
        className,
      )}
    >
      {title !== undefined && (
        <h3 className="mb-2 font-display text-lg font-semibold text-beam-core">{title}</h3>
      )}
      <div className="text-base text-soft-white">{children}</div>
      {footer !== undefined && (
        <div className="mt-3 border-t border-navy-line pt-3 text-sm text-mist">{footer}</div>
      )}
    </div>
  );
});
