"use client";

import { Edit3 } from "lucide-react";
import { CookieFormFields } from "@/components/admin/CookieFormFields";

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
  if (!isOpen || !cookie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 text-zinc-100  shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Edit Cookie #{cookie.id}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition text-xs cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <form 
          id="edit-cookie-form"
          action={async (fd) => {
            await onUpdate(fd);
            onClose();
          }} 
          className="space-y-6"
        >
          <input type="hidden" name="id" value={cookie.id} />
          
          <CookieFormFields 
            formId="edit-cookie-form" 
            defaultName={cookie.name}
            defaultDomains={cookie.domains || ""}
            defaultContent={cookie.cookieContent}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl transition cursor-pointer flex items-center gap-2 text-xs"
            >
              <Edit3 className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
