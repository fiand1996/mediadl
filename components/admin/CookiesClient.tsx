"use client";

import { useState } from "react";
import { Plus, Trash2, KeyRound, Globe, Edit3, ShieldAlert } from "lucide-react";
import { AddCookieModal } from "@/components/admin/AddCookieModal";
import { EditCookieModal } from "@/components/admin/EditCookieModal";

interface CookieItem {
  id: number;
  provider: string;
  name: string;
  domains: string | null;
  cookieContent: string;
  isActive: boolean;
  failCount: number;
}

interface CookiesClientProps {
  cookieManagers: CookieItem[];
  addCookieManagerAction: (formData: FormData) => Promise<void>;
  updateCookieManagerAction: (formData: FormData) => Promise<void>;
  deleteCookieManagerAction: (formData: FormData) => Promise<void>;
}

export function CookiesClient({
  cookieManagers,
  addCookieManagerAction,
  updateCookieManagerAction,
  deleteCookieManagerAction,
}: CookiesClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCookie, setEditingCookie] = useState<CookieItem | null>(null);

  return (
    <div className="admin-page mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="admin-eyebrow mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]">Configuration</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-emerald-600" />
            <span>Cookie Manager</span>
          </h1>
          <p className="admin-muted mt-2 text-sm">Manage cookie profiles and target domains for universal yt-dlp extractions.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="admin-primary-button flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold shadow-lg transition"
        >
          <Plus className="w-4 h-4" /> Add New Cookie
        </button>
      </div>

      {/* List Saved Cookies */}
      <div className="admin-card space-y-4 rounded-2xl border p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <KeyRound className="h-4 w-4 text-emerald-600" />
          <span>Active Cookies ({cookieManagers.length})</span>
          </h2>
          <span className="admin-count-badge rounded-full px-2.5 py-1 text-[11px] font-semibold">{cookieManagers.length} total</span>
        </div>

        {cookieManagers.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-zinc-500 text-xs ">No cookies configured yet.</p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs  rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add your first cookie
            </button>
          </div>
        ) : (
          <div className="space-y-3 ">
            {cookieManagers.map((cookie) => (
              <div key={cookie.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-zinc-700 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-sm">{cookie.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cookie.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {cookie.isActive ? 'Active' : 'Disabled'}
                    </span>
                    {cookie.failCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Fails: {cookie.failCount}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cookie.domains ? cookie.domains.split(',').map(d => (
                      <span key={d} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-400" /> {d.trim()}
                      </span>
                    )) : (
                      <span className="text-zinc-500 text-[10px]">Global / All domains</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button 
                    onClick={() => setEditingCookie(cookie)}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    title="Edit Cookie"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" /> Edit
                  </button>

                  <form action={deleteCookieManagerAction} onSubmit={(e) => {
                    if (!confirm(`Are you sure you want to delete "${cookie.name}"?`)) {
                      e.preventDefault();
                    }
                  }}>
                    <input type="hidden" name="id" value={cookie.id} />
                    <button 
                      type="submit"
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition cursor-pointer"
                      title="Delete Cookie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCookieModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onAdd={addCookieManagerAction} 
      />

      <EditCookieModal 
        cookie={editingCookie} 
        isOpen={Boolean(editingCookie)} 
        onClose={() => setEditingCookie(null)} 
        onUpdate={updateCookieManagerAction} 
      />
    </div>
  );
}
