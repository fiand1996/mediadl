"use client";

import { useEffect, useState } from "react";
import { Puzzle, KeyRound, Plus, Trash2, Edit3, ShieldCheck, ChevronDown, ChevronUp, FileText, ShieldAlert } from "lucide-react";
import { CookieSessionWarning } from "@/components/admin/CookieSessionWarning";
import { CurlParserBox, type CookieParserResult } from "@/components/admin/CurlParserBox";

interface ExtensionManifestItem {
  id: string;
  name: string;
  version: string;
  description?: string;
  urlPatterns: string[];
  cookies: {
    support: boolean;
    required: boolean;
    description?: string;
  };
  isEnabled: boolean;
}

interface CookieItem {
  id: number;
  provider: string;
  name: string;
  domains: string | null;
  cookieContent: string;
  isActive: boolean;
  failCount: number;
}

interface ExtensionsClientProps {
  extensions: ExtensionManifestItem[];
  allCookies: CookieItem[];
  addCookieAction: (formData: FormData) => Promise<void>;
  updateCookieAction: (formData: FormData) => Promise<void>;
  deleteCookieAction: (formData: FormData) => Promise<void>;
  toggleExtensionAction: (formData: FormData) => Promise<void>;
}

export function ExtensionsClient({
  extensions,
  allCookies,
  addCookieAction,
  updateCookieAction,
  deleteCookieAction,
  toggleExtensionAction,
}: ExtensionsClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addModalProvider, setAddModalProvider] = useState<string | null>(null);
  const [editingCookie, setEditingCookie] = useState<CookieItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [extensionStates, setExtensionStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(extensions.map((ext) => [ext.id, ext.isEnabled]))
  );

  useEffect(() => {
    setExtensionStates(Object.fromEntries(extensions.map((ext) => [ext.id, ext.isEnabled])));
  }, [extensions]);

  const filteredExtensions = extensions.filter((ext) => {
    const isEnabled = extensionStates[ext.id] ?? ext.isEnabled;
    const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ext.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ext.description && ext.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === "active") return matchesSearch && isEnabled;
    if (statusFilter === "disabled") return matchesSearch && !isEnabled;
    return matchesSearch;
  });

  const applyParsedCookie = (formId: string, result: CookieParserResult) => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    const nameInput = form.elements.namedItem("name");
    const contentInput = form.elements.namedItem("cookieContent");
    if (nameInput instanceof HTMLInputElement && !nameInput.value && result.name) {
      nameInput.value = result.name;
    }
    if (contentInput instanceof HTMLTextAreaElement) {
      contentInput.value = result.netscapeOutput;
    }
  };

  return (
    <div className="admin-page mx-auto max-w-6xl space-y-7 text-xs">
      <div>
        <p className="admin-eyebrow mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]">Integrations</p>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-3">
              <Puzzle className="h-7 w-7 text-emerald-600" />
              <span>Extensions</span>
            </h1>
            <p className="admin-muted mt-2 text-sm">
              Manage platform extractors, URL matchers, and extension cookie profiles.
            </p>
          </div>
          <span className="admin-count-badge w-fit rounded-full border px-3 py-1.5 text-xs font-semibold">{filteredExtensions.length} of {extensions.length} extensions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/80">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search extensions by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-2 rounded-xl font-medium transition cursor-pointer border ${statusFilter === "all" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-zinc-900 text-zinc-400 border-zinc-800"}`}
          >
            All ({extensions.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3.5 py-2 rounded-xl font-medium transition cursor-pointer border ${statusFilter === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-zinc-900 text-zinc-400 border-zinc-800"}`}
          >
            Active ({extensions.filter(e => (extensionStates[e.id] ?? e.isEnabled)).length})
          </button>
          <button
            onClick={() => setStatusFilter("disabled")}
            className={`px-3.5 py-2 rounded-xl font-medium transition cursor-pointer border ${statusFilter === "disabled" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-zinc-900 text-zinc-400 border-zinc-800"}`}
          >
            Disabled ({extensions.filter(e => !(extensionStates[e.id] ?? e.isEnabled)).length})
          </button>
        </div>
      </div>

      {/* Extensions Compact List */}
      <div className="space-y-4">
        {filteredExtensions.length === 0 ? (
          <div className="p-12 text-center bg-zinc-950/40 border border-zinc-800/80 rounded-2xl text-zinc-500">
            No extensions match your search or filter criteria.
          </div>
        ) : (
          filteredExtensions.map((ext) => {
            const extCookies = allCookies.filter((c) => c.provider === ext.id);
            const isExpanded = expandedId === ext.id;
            const isEnabled = extensionStates[ext.id] ?? ext.isEnabled;

            return (
              <div 
                key={ext.id}
                className={`admin-card space-y-4 rounded-2xl border p-5 transition-all ${!isEnabled ? 'opacity-60 bg-zinc-950/20' : ''}`}
              >
                {/* Row Summary Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`admin-icon-tile flex h-10 w-10 items-center justify-center rounded-xl border font-bold text-sm ${isEnabled ? 'admin-icon-green' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                      {ext.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{ext.name}</span>
                        <span className="admin-count-badge rounded-full px-2 py-0.5 text-[10px] font-medium">v{ext.version}</span>
                        {isEnabled ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] px-2 py-0.5 rounded-full">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{ext.description || `Module ID: ${ext.id}`}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <form
                      action={async (formData) => {
                        await toggleExtensionAction(formData);
                      }}
                      className="flex items-center"
                    >
                      <input type="hidden" name="id" value={ext.id} />
                      <input type="hidden" name="isEnabled" value={extensionStates[ext.id] ? "true" : "false"} />
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={isEnabled}
                          aria-label={`${isEnabled ? "Disable" : "Enable"} ${ext.name}`}
                          className="peer sr-only"
                          onChange={(event) => {
                            const isEnabled = event.currentTarget.checked;
                            setExtensionStates((current) => ({ ...current, [ext.id]: isEnabled }));
                            const form = event.currentTarget.form;
                            const hiddenInput = form?.elements.namedItem("isEnabled");
                            if (hiddenInput instanceof HTMLInputElement) {
                              hiddenInput.value = isEnabled ? "true" : "false";
                            }
                            form?.requestSubmit();
                          }}
                        />
                        <span className="h-6 w-11 rounded-full border border-zinc-700 bg-zinc-800 transition-colors peer-checked:border-emerald-500/40 peer-checked:bg-emerald-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-400 after:absolute after:left-[3px] after:top-[3px] after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                      </label>
                    </form>

                    {ext.cookies.support && (
                      <button
                        onClick={() => setAddModalProvider(ext.id)}
                        className="admin-primary-button flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 font-semibold transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Cookie ({extCookies.length})
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ext.id)}
                      className="admin-secondary-button flex cursor-pointer items-center gap-1 rounded-xl border px-3.5 py-2 transition"
                    >
                      <span>{isExpanded ? "Hide" : "Details"}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Details Section */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 pt-5 space-y-5 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                        <span className="text-zinc-400 font-bold block">URL Matchers ({ext.urlPatterns.length})</span>
                        <div className="space-y-1 overflow-x-auto text-[11px] text-zinc-300">
                          {ext.urlPatterns.map((pat, i) => (
                            <div key={i} className="bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                              <code>{pat.toString()}</code>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                        <span className="text-zinc-400 font-bold block">Cookie Policy</span>
                        <div className="space-y-2 text-[11px]">
                          <div className="flex justify-between bg-zinc-900 px-3 py-2 rounded-lg">
                            <span className="text-zinc-400">Supported</span>
                            <span className={ext.cookies.support ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                              {ext.cookies.support ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between bg-zinc-900 px-3 py-2 rounded-lg">
                            <span className="text-zinc-400">Required</span>
                            <span className={ext.cookies.required ? "text-amber-400 font-bold" : "text-zinc-400"}>
                              {ext.cookies.required ? "Mandatory" : "Optional"}
                            </span>
                          </div>
                          {ext.cookies.description && (
                            <p className="text-zinc-400 text-[10px] italic">{ext.cookies.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cookie Table for Extension */}
                    {ext.cookies.support && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-cyan-400" />
                            <span>Configured Cookies ({extCookies.length})</span>
                          </h3>
                        </div>

                        {extCookies.length === 0 ? (
                          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-zinc-500">
                            No cookies configured for {ext.name} yet. Click &quot;Add Cookie&quot; above.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {extCookies.map((cookie) => (
                              <div key={cookie.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">{cookie.name}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${cookie.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                      {cookie.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                    {cookie.failCount > 0 && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3" /> Fails: {cookie.failCount}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCookie(cookie)}
                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" /> Edit
                                  </button>
                                  <form action={deleteCookieAction} onSubmit={(e) => {
                                    if (!confirm(`Delete cookie "${cookie.name}"?`)) e.preventDefault();
                                  }}>
                                    <input type="hidden" name="id" value={cookie.id} />
                                    <button 
                                      type="submit"
                                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition cursor-pointer"
                                      title="Delete"
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
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Cookie Modal for Extension */}
      {addModalProvider && (
        <div className="admin-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-dialog relative my-8 w-full max-w-2xl space-y-5 rounded-2xl border p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Add Cookie for {addModalProvider}</h2>
              </div>
              <button 
                onClick={() => setAddModalProvider(null)}
                className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800 transition text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form 
              id="add-ext-cookie-form"
              action={async (fd) => {
                await addCookieAction(fd);
                setAddModalProvider(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="provider" value={addModalProvider} />
              <CookieSessionWarning />

              <div>
                <label htmlFor="add-ext-cookie-name" className="admin-form-label mb-1.5 block font-medium">Account name</label>
                <input 
                  id="add-ext-cookie-name"
                  type="text" 
                  name="name" 
                  placeholder="e.g. Personal account"
                  required
                  className="admin-form-input w-full rounded-xl border px-3.5 py-3 text-sm transition"
                />
              </div>

              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="add-ext-cookie-content" className="admin-form-label flex items-center gap-1.5 font-medium">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Cookie content</span>
                  </label>
                  <CurlParserBox
                    onParsed={(result) => applyParsedCookie("add-ext-cookie-form", result)}
                  />
                </div>
                <p className="admin-form-hint mb-1.5">Paste Netscape cookie file content (.txt format).</p>
                <textarea 
                  id="add-ext-cookie-content"
                  name="cookieContent" 
                  rows={7}
                  placeholder="# Netscape HTTP Cookie File..." 
                  required
                  spellCheck={false}
                  className="admin-form-input w-full resize-y rounded-xl border px-3.5 py-3 font-mono text-xs leading-relaxed transition"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button 
                  type="button"
                  onClick={() => setAddModalProvider(null)}
                  className="admin-secondary-button cursor-pointer rounded-xl border px-4 py-2.5 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="admin-primary-button flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition"
                >
                  <Plus className="w-4 h-4" /> Save Cookie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cookie Modal for Extension */}
      {editingCookie && (
        <div className="admin-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-dialog relative my-8 w-full max-w-2xl space-y-5 rounded-2xl border p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Edit Cookie #{editingCookie.id} ({editingCookie.provider})</h2>
              </div>
              <button 
                onClick={() => setEditingCookie(null)}
                className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800 transition text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form 
              id="edit-ext-cookie-form"
              action={async (fd) => {
                await updateCookieAction(fd);
                setEditingCookie(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingCookie.id} />
              <input type="hidden" name="provider" value={editingCookie.provider} />
              <CookieSessionWarning />

              <div>
                <label htmlFor="edit-ext-cookie-name" className="admin-form-label mb-1.5 block font-medium">Account name</label>
                <input 
                  id="edit-ext-cookie-name"
                  type="text" 
                  name="name" 
                  defaultValue={editingCookie.name}
                  required
                  className="admin-form-input w-full rounded-xl border px-3.5 py-3 text-sm transition"
                />
              </div>

              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="edit-ext-cookie-content" className="admin-form-label flex items-center gap-1.5 font-medium">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Cookie content</span>
                  </label>
                  <CurlParserBox
                    defaultDomain={editingCookie.domains || ""}
                    onParsed={(result) => applyParsedCookie("edit-ext-cookie-form", result)}
                  />
                </div>
                <p className="admin-form-hint mb-1.5">Paste Netscape cookie file content (.txt format).</p>
                <textarea 
                  id="edit-ext-cookie-content"
                  name="cookieContent" 
                  rows={7}
                  defaultValue={editingCookie.cookieContent}
                  required
                  spellCheck={false}
                  className="admin-form-input w-full resize-y rounded-xl border px-3.5 py-3 font-mono text-xs leading-relaxed transition"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button 
                  type="button"
                  onClick={() => setEditingCookie(null)}
                  className="admin-secondary-button cursor-pointer rounded-xl border px-4 py-2.5 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="admin-primary-button flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition"
                >
                  <Edit3 className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
