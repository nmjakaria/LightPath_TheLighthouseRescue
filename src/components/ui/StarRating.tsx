"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { uiConfig } from "@/config/uiConfig";
import { cn } from "./cn";

export type StarValue = 0 | 1 | 2 | 3;

export interface StarRatingProps extends Omit<HTMLAttributes<HTMLSpanElement>, "onChange"> {
  value: StarValue;
  onChange?: (value: StarValue) => void;
}

const STAR_PATH = "M12 2l2.9 6.2 6.8.9-5 4.8 1.3 6.8L12 17.6 6 20.7l1.3-6.8-5-4.8 6.8-.9z";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-6 w-6", filled ? "fill-star-gold" : "fill-navy-line")} aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
  );
}

export const StarRating = forwardRef<HTMLSpanElement, StarRatingProps>(function StarRating(
  { value, onChange, className, ...rest },
  ref,
) {
  const count = uiConfig.starRating.max;
  const stars = Array.from({ length: count }, (_, index) => (index + 1) as StarValue);

  if (!onChange) {
    return (
      <span {...rest} ref={ref} role="img" aria-label={`${value} of ${count} stars`} className={cn("inline-flex gap-1", className)}>
        {stars.map((star) => (
          <StarIcon key={star} filled={star <= value} />
        ))}
      </span>
    );
  }

  return (
    <span {...rest} ref={ref} role="group" aria-label="Star rating" className={cn("inline-flex gap-1", className)}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Set rating to ${star} ${star === 1 ? "star" : "stars"}`}
          aria-pressed={star === value}
          onClick={() => onChange(star)}
          className="rounded-button transition-transform motion-reduce:transition-none hover:scale-110"
        >
          <StarIcon filled={star <= value} />
        </button>
      ))}
    </span>
  );
});
