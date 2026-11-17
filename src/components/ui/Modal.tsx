"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./cn";

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  { open, onClose, title, children, footer, className, ...rest },
  ref,
) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const [first] = focusables();
    if (first) first.focus();
    else dialog?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === firstItem || document.activeElement === dialog)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={() => closeRef.current()}
        className="absolute inset-0 h-full w-full cursor-default bg-abyss/80"
      />
      <div
        {...rest}
        ref={(node) => {
          dialogRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-card border border-navy-line bg-deep-navy p-6",
          className,
        )}
      >
        <h2 id={titleId} className="font-display text-2xl font-semibold text-beam-core">
          {title}
        </h2>
        <div className="mt-4 text-base text-soft-white">{children}</div>
        {footer !== undefined && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
});
