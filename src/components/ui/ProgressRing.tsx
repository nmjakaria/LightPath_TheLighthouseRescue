import type { HTMLAttributes } from "react";
import { uiConfig } from "@/config/uiConfig";
import { clamp01 } from "@/lib/math/easing";
import { cn } from "./cn";

export type ProgressTone = "cyan" | "success" | "warning" | "danger";

export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  tone?: ProgressTone;
  label?: string;
  size?: number;
  strokeWidth?: number;
}

const toneClasses: Record<ProgressTone, string> = {
  cyan: "stroke-cyan-beam",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-danger",
};

export function ProgressRing({
  value,
  tone = "cyan",
  label,
  size = uiConfig.progressRing.size,
  strokeWidth = uiConfig.progressRing.strokeWidth,
  className,
  ...rest
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp01(value);
  const center = size / 2;

  return (
    <div {...rest} className={cn("relative inline-flex", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ?? `${Math.round(progress * 100)} percent`}
      >
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-navy-line" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${center} ${center})`}
          className={cn("transition-all motion-reduce:transition-none", toneClasses[tone])}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-soft-white">
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}
