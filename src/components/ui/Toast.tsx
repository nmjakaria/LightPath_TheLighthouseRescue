"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { uiConfig } from "@/config/uiConfig";
import { cn } from "./cn";
import { initialToastState, toastReducer, type ToastTone } from "./toastState";

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside a ToastProvider");
  return value;
}

const toneClasses: Record<ToastTone, string> = {
  info: "border-cyan-beam text-soft-white",
  success: "border-success text-soft-white",
  warning: "border-warning text-soft-white",
  danger: "border-danger text-soft-white",
};

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
  tone?: ToastTone;
  onDismiss?: () => void;
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { message, tone = "info", onDismiss, className, ...rest },
  ref,
) {
  return (
    <div
      {...rest}
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-between gap-4 rounded-card border bg-midnight/80 px-4 py-3 text-sm backdrop-blur-sm",
        toneClasses[tone],
        className,
      )}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={onDismiss}
          className="rounded-button px-2 text-mist hover:text-beam-core"
        >
          ×
        </button>
      )}
    </div>
  );
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, initialToastState);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    dispatch({ type: "dismiss", id });
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    dispatch({ type: "show", message, tone });
  }, []);

  useEffect(() => {
    const liveIds = new Set(state.items.map((item) => item.id));
    for (const item of state.items) {
      if (timers.current.has(item.id)) continue;
      const timer = setTimeout(() => {
        timers.current.delete(item.id);
        dispatch({ type: "dismiss", id: item.id });
      }, uiConfig.toast.durationMs);
      timers.current.set(item.id, timer);
    }
    for (const [id, timer] of timers.current) {
      if (!liveIds.has(id)) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    }
  }, [state.items]);

  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active.values()) clearTimeout(timer);
      active.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex flex-col items-center gap-2 px-4"
      >
        {state.items.map((item) => (
          <div key={item.id} className="pointer-events-auto w-full max-w-md">
            <Toast message={item.message} tone={item.tone} onDismiss={() => dismissToast(item.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
