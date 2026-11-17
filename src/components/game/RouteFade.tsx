"use client";

/* Route transitions are short fades keyed by pathname. A 250 ms CSS animation avoids a renderer
 * per frame; effective reduced-motion settings replace it with an instant change. */
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { uiConfig } from "@/config/uiConfig";
import { cn } from "@/components/ui";
import { useSettings } from "@/hooks/useSettings";

export function RouteFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { effective } = useSettings();

  return (
    <div
      key={pathname ?? "route"}
      className={cn("route-fade min-h-screen", effective.reducedMotion && "route-fade--instant")}
      style={{ animationDuration: `${uiConfig.routeFadeMs}ms` }}
    >
      {children}
    </div>
  );
}
