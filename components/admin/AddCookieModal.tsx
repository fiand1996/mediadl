"use client";

import { KeyRound, Plus } from "lucide-react";
import { CookieFormFields } from "@/components/admin/CookieFormFields";
import { Modal } from "@/components/ui/modal";

interface AddCookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (formData: FormData) => Promise<void>;
}

export function AddCookieModal({ isOpen, onClose, onAdd }: AddCookieModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      icon={<KeyRound className="h-5 w-5 text-emerald-400" />}
      title="Add cookie profile"
      description="Connect an account session for supported media sources."
    >
      <form 
        id="add-cookie-form"
        action={async (fd) => {
          await onAdd(fd);
          onClose();
        }} 
        className="space-y-5"
      >
        <CookieFormFields formId="add-cookie-form" showProviderSelector={true} />

        <div className="flex items-center justify-end gap-3 border-t border-zinc-800/80 pt-5">
          <button 
            type="button"
            onClick={onClose}
            className="admin-secondary-button cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="admin-primary-button flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Save Cookie
          </button>
        </div>
      </form>
    </Modal>
  );
}
