"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = React.useMemo(
    () => ({
      success: (message: string, title?: string) =>
        addToast({ type: "success", title, message }),
      error: (message: string, title?: string) =>
        addToast({ type: "error", title, message }),
      info: (message: string, title?: string) =>
        addToast({ type: "info", title, message }),
      warning: (message: string, title?: string) =>
        addToast({ type: "warning", title, message }),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-2xl p-4 neo-floating bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-start gap-3 transition-all duration-300 transform translate-y-0 shadow-lg"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              {t.type === "warning" && (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              {t.type === "info" && <Info className="w-5 h-5 text-sky-500" />}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {t.title}
                </p>
              )}
              <p className="text-xs text-[var(--text-secondary)] break-words">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
