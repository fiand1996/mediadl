"use client";

import { useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [isPending, startTransition] = useTransition();
  const busy = isLoading || isPending;

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
    });
  };

  const iconElement = (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
        variant === "danger"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
      }`}
    >
      <AlertTriangle className="h-5 w-5" />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      closeOnEsc={!busy}
      closeOnBackdrop={!busy}
      icon={iconElement}
      title={title}
      description="Please confirm this action"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition cursor-pointer text-xs disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-amber-600 hover:bg-amber-500 text-white"
            }`}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </>
      }
    >
      <p className="text-xs text-zinc-300 leading-relaxed">{description}</p>
    </Modal>
  );
}
