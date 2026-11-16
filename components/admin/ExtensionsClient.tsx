"use client";

import { useState } from "react";
import { Puzzle, KeyRound, Plus, Trash2, Edit3, ShieldCheck, ChevronDown, ChevronUp, Terminal, Wand2, FileText, ShieldAlert } from "lucide-react";

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
}

export function ExtensionsClient({
  extensions,
  allCookies,
  addCookieAction,
  updateCookieAction,
  deleteCookieAction,
}: ExtensionsClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addModalProvider, setAddModalProvider] = useState<string | null>(null);
  const [editingCookie, setEditingCookie] = useState<CookieItem | null>(null);

  // cURL parser helper logic
  const [curlCommand, setCurlCommand] = useState("");
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  const handleParseCurl = (formId: string, defaultDomain: string) => {
    if (!curlCommand.trim()) return;

    try {
      let cookiesStr = "";
      let urlStr = "";
      let nameGuess = "";

      const urlMatch = curlCommand.match(/(?:['"])(https?:\/\/[^'"]+)(?:['"])|(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        urlStr = urlMatch[1] || urlMatch[2] || "";
        try {
          const parsedUrl = new URL(urlStr);
          nameGuess = `${parsedUrl.hostname} Session`;
        } catch {
          // ignore
        }
      }

      const cookieHeaderMatch = curlCommand.match(/(?:-H|--header)\s+['"](?:[Cc][Oo][Oo][Kk][Ii][Ee]:\s*)([^'"]+)['"]/i) ||
                                curlCommand.match(/(?:-H|--header)\s+(?:[Cc][Oo][Oo][Kk][Ii][Ee]:\s*)([^\s'"]+)/i) ||
                                curlCommand.match(/(?:--cookie|-b)\s+['"]([^'"]+)['"]/i) ||
                                curlCommand.match(/(?:--cookie|-b)\s+([^\s'"]+)/i);

      if (cookieHeaderMatch) {
        cookiesStr = cookieHeaderMatch[1];
      } else {
        setParseStatus("Could not find Cookie header in cURL command.");
        return;
      }

      let netscapeOutput = "";
      let hostname = defaultDomain;

      if (urlStr) {
        try {
          hostname = new URL(urlStr).hostname.replace(/^www\./, "");
        } catch {
          // ignore
        }
      }

      if (cookiesStr.includes("\t") || cookiesStr.includes("# Netscape")) {
        netscapeOutput = cookiesStr;
      } else {
        if (!hostname) {
          setParseStatus("Could not determine target domain. Please include URL in cURL.");
          return;
        }
        const pairs = cookiesStr.split(";");
        const lines = ["# Netscape HTTP Cookie File", `# Parsed from cURL on ${new Date().toISOString()}`];
        for (const pair of pairs) {
          const parts = pair.trim().split("=");
          if (parts.length >= 2) {
            const cName = parts[0].trim();
            const cVal = parts.slice(1).join("=").trim();
            lines.push(`${hostname}\tTRUE\t/\tTRUE\t2147483647\t${cName}\t${cVal}`);
          }
        }
        netscapeOutput = lines.join("\n");
      }

      const form = document.getElementById(formId) as HTMLFormElement;
      if (form) {
        const nameInput = form.elements.namedItem("name") as HTMLInputElement;
        const contentInput = form.elements.namedItem("cookieContent") as HTMLTextAreaElement;
        const domainHiddenInput = form.elements.namedItem("domains") as HTMLInputElement;

        if (nameInput && !nameInput.value && nameGuess) nameInput.value = nameGuess;
        if (contentInput) contentInput.value = netscapeOutput;
        if (domainHiddenInput && hostname) {
          domainHiddenInput.value = hostname;
          domainHiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      setParseStatus("Successfully parsed cURL!");
      setTimeout(() => setParseStatus(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid syntax";
      setParseStatus(`Failed: ${msg}`);
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
          <span className="admin-count-badge w-fit rounded-full border px-3 py-1.5 text-xs font-semibold">{extensions.length} installed</span>
        </div>
      </div>

      {/* Extensions Compact List */}
      <div className="space-y-4">
        {extensions.map((ext) => {
          const extCookies = allCookies.filter((c) => c.provider === ext.id);
          const isExpanded = expandedId === ext.id;

          return (
            <div 
              key={ext.id}
              className="admin-card space-y-4 rounded-2xl border p-5 transition-all"
            >
              {/* Row Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="admin-icon-tile admin-icon-green flex h-10 w-10 items-center justify-center rounded-xl border font-bold text-sm">
                    {ext.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{ext.name}</span>
                      <span className="admin-count-badge rounded-full px-2 py-0.5 text-[10px] font-medium">v{ext.version}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Active
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{ext.description || `Module ID: ${ext.id}`}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
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
        })}
      </div>

      {/* Add Cookie Modal for Extension */}
      {addModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 text-zinc-100  shadow-2xl relative my-8 space-y-5">
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

            {/* cURL Parser Box */}
            <div className="p-4 bg-zinc-950 border border-indigo-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>⚡ Import from cURL (CLI)</span>
                </label>
                <span className="text-[10px] text-zinc-500">Paste browser cURL</span>
              </div>
              <textarea
                value={curlCommand}
                onChange={(e) => setCurlCommand(e.target.value)}
                rows={3}
                placeholder="curl 'https://...' -H 'cookie: ...'"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200  focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between">
                {parseStatus ? (
                  <span className={`text-[11px] ${parseStatus.includes("Successfully") ? "text-emerald-400" : "text-amber-400"}`}>
                    {parseStatus}
                  </span>
                ) : <span />}
                <button
                  type="button"
                  onClick={() => handleParseCurl("add-ext-cookie-form", "")}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Parse cURL
                </button>
              </div>
            </div>

            <form 
              id="add-ext-cookie-form"
              action={async (fd) => {
                await addCookieAction(fd);
                setAddModalProvider(null);
                setCurlCommand("");
              }}
              className="space-y-4"
            >
              <input type="hidden" name="provider" value={addModalProvider} />

              <div>
                <label className="block text-zinc-400 mb-1">Account Label / Name</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="e.g. Account Burner 1" 
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Netscape Cookies Content (.txt format)</span>
                </label>
                <textarea 
                  name="cookieContent" 
                  rows={5}
                  placeholder="# Netscape HTTP Cookie File..." 
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100  text-[11px] focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setAddModalProvider(null)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 text-zinc-100  shadow-2xl relative my-8 space-y-5">
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

            {/* cURL Parser Box */}
            <div className="p-4 bg-zinc-950 border border-indigo-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>⚡ Replace Content from cURL (CLI)</span>
                </label>
                <span className="text-[10px] text-zinc-500">Paste updated cURL</span>
              </div>
              <textarea
                value={curlCommand}
                onChange={(e) => setCurlCommand(e.target.value)}
                rows={3}
                placeholder="curl 'https://...' -H 'cookie: ...'"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200  focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between">
                {parseStatus ? (
                  <span className={`text-[11px] ${parseStatus.includes("Successfully") ? "text-emerald-400" : "text-amber-400"}`}>
                    {parseStatus}
                  </span>
                ) : <span />}
                <button
                  type="button"
                  onClick={() => handleParseCurl("edit-ext-cookie-form", editingCookie.domains || "")}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Parse cURL
                </button>
              </div>
            </div>

            <form 
              id="edit-ext-cookie-form"
              action={async (fd) => {
                await updateCookieAction(fd);
                setEditingCookie(null);
                setCurlCommand("");
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingCookie.id} />
              <input type="hidden" name="provider" value={editingCookie.provider} />

              <div>
                <label className="block text-zinc-400 mb-1">Account Label / Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={editingCookie.name}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Netscape Cookies Content (.txt format)</span>
                </label>
                <textarea 
                  name="cookieContent" 
                  rows={5}
                  defaultValue={editingCookie.cookieContent}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100  text-[11px] focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setEditingCookie(null)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
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
