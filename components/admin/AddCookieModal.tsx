"use client";

import { KeyRound, Plus } from "lucide-react";
import { CookieFormFields } from "@/components/admin/CookieFormFields";

interface AddCookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (formData: FormData) => Promise<void>;
}

export function AddCookieModal({ isOpen, onClose, onAdd }: AddCookieModalProps) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="admin-dialog relative my-8 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4 border-b pb-5">
          <div className="flex items-start gap-3">
            <span className="admin-dialog-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Add cookie profile</h2>
              <p className="admin-muted mt-1 text-xs">Connect an account session for supported media sources.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="admin-secondary-button shrink-0 rounded-lg border px-3 py-1.5 text-xs transition"
          >
            Close
          </button>
        </div>

        <form 
          id="add-cookie-form"
          action={async (fd) => {
            await onAdd(fd);
            onClose();
          }} 
          className="space-y-5"
        >
          <CookieFormFields formId="add-cookie-form" />

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <button 
              type="button"
              onClick={onClose}
              className="admin-secondary-button cursor-pointer rounded-xl border px-4 py-2.5 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="admin-primary-button flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Save Cookie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
