"use client";

import { Plus } from "lucide-react";
import { CookieFormFields } from "@/components/admin/CookieFormFields";

interface AddCookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (formData: FormData) => Promise<void>;
}

export function AddCookieModal({ isOpen, onClose, onAdd }: AddCookieModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 text-zinc-100  shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Add New Cookie</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition text-xs cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <form 
          id="add-cookie-form"
          action={async (fd) => {
            await onAdd(fd);
            onClose();
          }} 
          className="space-y-6"
        >
          <CookieFormFields formId="add-cookie-form" />

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
              <Plus className="w-4 h-4" /> Save Cookie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
