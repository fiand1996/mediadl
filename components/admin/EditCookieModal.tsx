"use client";

import { KeyRound, Save } from "lucide-react";
import { CookieFormFields } from "@/components/admin/CookieFormFields";
import { Modal } from "@/components/ui/modal";

interface CookieItem {
  id: number;
  provider: string;
  name: string;
  domains: string | null;
  cookieContent: string;
  isActive: boolean;
}

interface EditCookieModalProps {
  cookie: CookieItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (formData: FormData) => Promise<void>;
}

export function EditCookieModal({ cookie, isOpen, onClose, onUpdate }: EditCookieModalProps) {
  if (!cookie) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      icon={<KeyRound className="h-5 w-5 text-emerald-400" />}
      title="Edit cookie profile"
      description="Update the saved session and its target domains."
    >
      <form 
        id="edit-cookie-form"
        action={async (fd) => {
          await onUpdate(fd);
          onClose();
        }} 
        className="space-y-5"
      >
        <input type="hidden" name="id" value={cookie.id} />
        
        <CookieFormFields 
          formId="edit-cookie-form" 
          defaultName={cookie.name}
          defaultProvider={cookie.provider}
          defaultDomains={cookie.domains || ""}
          defaultContent={cookie.cookieContent}
          showProviderSelector={cookie.provider === "yt-dlp" || cookie.provider === "gallery-dl"}
        />

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
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
