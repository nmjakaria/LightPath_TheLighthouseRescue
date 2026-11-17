import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui";
import { NightBackdrop } from "./NightBackdrop";

export interface ScreenShellProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  wide?: boolean;
}

/* Shared page frame: the night scene sits behind a normally stacked, readable content column. */
export function ScreenShell({ children, className, wide = false, ...rest }: ScreenShellProps) {
  return (
    <main
      {...rest}
      className={cn("relative min-h-screen overflow-hidden bg-abyss text-soft-white", className)}
    >
      <NightBackdrop />
      <div className={cn("relative z-10 mx-auto w-full px-6 py-10", wide ? "max-w-6xl" : "max-w-4xl")}>
        {children}
      </div>
    </main>
  );
}
