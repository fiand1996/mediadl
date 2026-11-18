"use client";

import * as React from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  bodyClassName?: string;
  showCloseButton?: boolean;
  zIndex?: string;
}

const maxWidthMap: Record<NonNullable<ModalProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  maxWidth = "lg",
  children,
  footer,
  closeOnEsc = true,
  closeOnBackdrop = true,
  className,
  bodyClassName,
  showCloseButton = true,
  zIndex = "z-50",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEsc) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150",
        zIndex
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "bg-zinc-900 border border-zinc-800 rounded-2xl w-full my-auto shadow-2xl relative overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] animate-in fade-in zoom-in-95 duration-150",
          maxWidthMap[maxWidth],
          className
        )}
      >
        {/* Modal Header */}
        {(title || icon || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-zinc-800/80 shrink-0">
            <div className="flex items-start gap-3">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-emerald-400">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="font-bold text-white text-base leading-tight">
                    {title}
                  </h3>
                )}
                {description && (
                  <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {description}
                  </div>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className={cn("p-5 sm:p-6 overflow-y-auto", bodyClassName)}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950/40 shrink-0 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
