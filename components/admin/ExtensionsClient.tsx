"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Puzzle,
  KeyRound,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Store,
  DownloadCloud,
  RotateCcw,
  CheckCircle2,
  Package,
  Settings2,
  Globe,
  Loader2,
} from "lucide-react";
import { CookieSessionWarning } from "@/components/admin/CookieSessionWarning";
import {
  CurlParserBox,
  type CookieParserResult,
} from "@/components/admin/CurlParserBox";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { Modal } from "@/components/ui/modal";

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

export interface MarketplaceItem {
  id: string;
  name: string;
  version: string;
  description?: string;
  urlPatterns: string[];
  bundleFile: string;
  downloadUrl?: string;
  size: number;
  sha256: string;
  repoName?: string;
}

export interface ExtensionRepoItem {
  id: string;
  name: string;
  url: string;
  isEnabled: boolean;
  isOfficial: boolean;
  createdAt: Date;
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
  marketplaceExtensions: MarketplaceItem[];
  repositories: ExtensionRepoItem[];
  allCookies: CookieItem[];
  addCookieAction: (formData: FormData) => Promise<void>;
  updateCookieAction: (formData: FormData) => Promise<void>;
  deleteCookieAction: (formData: FormData) => Promise<void>;
  toggleExtensionAction: (formData: FormData) => Promise<void>;
  installExtensionAction: (formData: FormData) => Promise<void>;
  uninstallExtensionAction: (formData: FormData) => Promise<void>;
  addRepositoryAction: (formData: FormData) => Promise<void>;
  toggleRepositoryAction: (formData: FormData) => Promise<void>;
  deleteRepositoryAction: (formData: FormData) => Promise<void>;
}

function SwitchToggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function ExtensionsClient({
  extensions,
  marketplaceExtensions,
  repositories,
  allCookies,
  addCookieAction,
  updateCookieAction,
  deleteCookieAction,
  toggleExtensionAction,
  installExtensionAction,
  uninstallExtensionAction,
  addRepositoryAction,
  toggleRepositoryAction,
  deleteRepositoryAction,
}: ExtensionsClientProps) {
  const [activeTab, setActiveTab] = useState<
    "installed" | "marketplace" | "repositories"
  >("installed");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addModalProvider, setAddModalProvider] = useState<string | null>(null);
  const [addRepoModalOpen, setAddRepoModalOpen] = useState(false);
  const [editingCookie, setEditingCookie] = useState<CookieItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "danger" | "warning";
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  const [extensionOverrides, setExtensionOverrides] = useState<
    Record<string, boolean>
  >({});
  const [repoOverrides, setRepoOverrides] = useState<Record<string, boolean>>(
    {},
  );

  const extensionStates = useMemo(
    () => ({
      ...Object.fromEntries(extensions.map((ext) => [ext.id, ext.isEnabled])),
      ...extensionOverrides,
    }),
    [extensions, extensionOverrides],
  );

  const repoStates = useMemo(
    () => ({
      ...Object.fromEntries(repositories.map((r) => [r.id, r.isEnabled])),
      ...repoOverrides,
    }),
    [repositories, repoOverrides],
  );

  const installedMap = new Map(extensions.map((e) => [e.id, e]));
  const marketplaceMap = new Map(marketplaceExtensions.map((e) => [e.id, e]));

  const filteredInstalled = extensions.filter((ext) => {
    const isEnabled = extensionStates[ext.id] ?? ext.isEnabled;
    const matchesSearch =
      ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ext.description &&
        ext.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === "active") return matchesSearch && isEnabled;
    if (statusFilter === "disabled") return matchesSearch && !isEnabled;
    return matchesSearch;
  });

  const filteredMarketplace = marketplaceExtensions.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const applyParsedCookie = (formId: string, result: CookieParserResult) => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    const nameInput = form.elements.namedItem("name");
    const contentInput = form.elements.namedItem("cookieContent");
    if (
      nameInput instanceof HTMLInputElement &&
      !nameInput.value &&
      result.name
    ) {
      nameInput.value = result.name;
    }
    if (contentInput instanceof HTMLTextAreaElement) {
      contentInput.value = result.netscapeOutput;
    }
  };

  const handleToggleExtension = (id: string, nextState: boolean) => {
    setExtensionOverrides((prev) => ({ ...prev, [id]: nextState }));
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("isEnabled", nextState ? "true" : "false");
      await toggleExtensionAction(formData);
    });
  };

  const handleToggleRepo = (id: string, nextState: boolean) => {
    setRepoOverrides((prev) => ({ ...prev, [id]: nextState }));
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("isEnabled", nextState ? "true" : "false");
      await toggleRepositoryAction(formData);
    });
  };

  const handleInstallExtension = async (item: MarketplaceItem) => {
    setInstallingId(item.id);
    try {
      const formData = new FormData();
      formData.set("id", item.id);
      formData.set("downloadUrl", item.downloadUrl || "");
      await installExtensionAction(formData);
    } finally {
      setInstallingId(null);
    }
  };

  const promptUninstallExtension = (ext: ExtensionManifestItem) => {
    setConfirmDialog({
      isOpen: true,
      title: `Uninstall ${ext.name}?`,
      description: `Are you sure you want to uninstall "${ext.name}" (v${ext.version})? All platform extractors and domain matchers for this extension will be removed.`,
      confirmText: "Yes, Uninstall",
      variant: "danger",
      onConfirm: async () => {
        const formData = new FormData();
        formData.set("id", ext.id);
        await uninstallExtensionAction(formData);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const promptDeleteCookie = (cookie: CookieItem) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Cookie?`,
      description: `Delete session cookie "${cookie.name}" for provider "${cookie.provider}"?`,
      confirmText: "Delete Cookie",
      variant: "danger",
      onConfirm: async () => {
        const formData = new FormData();
        formData.set("id", String(cookie.id));
        await deleteCookieAction(formData);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const promptDeleteRepo = (repo: ExtensionRepoItem) => {
    setConfirmDialog({
      isOpen: true,
      title: `Remove Repository?`,
      description: `Are you sure you want to remove custom repository "${repo.name}" (${repo.url})?`,
      confirmText: "Remove Repository",
      variant: "danger",
      onConfirm: async () => {
        const formData = new FormData();
        formData.set("id", repo.id);
        await deleteRepositoryAction(formData);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="admin-page mx-auto max-w-6xl space-y-7 text-xs">
      <div>
        <p className="admin-eyebrow mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
          Integrations
        </p>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-3">
              <Puzzle className="h-7 w-7 text-emerald-600" />
              <span>Extensions</span>
            </h1>
            <p className="admin-muted mt-2 text-sm">
              Modular scrapers, decoupled repository extensions, and cookie
              profiles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="admin-count-badge w-fit rounded-full border px-3 py-1.5 text-xs font-semibold">
              {extensions.length} Installed
            </span>
            <span className="admin-count-badge w-fit rounded-full border px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {marketplaceExtensions.length} Available
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("installed");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition cursor-pointer border ${
            activeTab === "installed"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Installed ({extensions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("marketplace");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition cursor-pointer border ${
            activeTab === "marketplace"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Explore Repository ({marketplaceExtensions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("repositories");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition cursor-pointer border ${
            activeTab === "repositories"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Repositories ({repositories.length})</span>
        </button>
      </div>

      {/* Search and Filters Bar (for Installed and Marketplace tabs) */}
      {activeTab !== "repositories" && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/80">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder={
                activeTab === "installed"
                  ? "Search installed extensions..."
                  : "Search community extensions in repository..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {activeTab === "installed" && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer border ${
                  statusFilter === "all"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                All ({extensions.length})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer border ${
                  statusFilter === "active"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                Active (
                {
                  extensions.filter((e) => extensionStates[e.id] ?? e.isEnabled)
                    .length
                }
                )
              </button>
              <button
                onClick={() => setStatusFilter("disabled")}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer border ${
                  statusFilter === "disabled"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                Disabled (
                {
                  extensions.filter(
                    (e) => !(extensionStates[e.id] ?? e.isEnabled),
                  ).length
                }
                )
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: INSTALLED EXTENSIONS */}
      {activeTab === "installed" && (
        <div className="space-y-4">
          {filteredInstalled.length === 0 ? (
            <div className="p-12 text-center bg-zinc-950/40 border border-zinc-800/80 rounded-2xl text-zinc-500 space-y-3">
              <Package className="w-8 h-8 mx-auto text-zinc-600" />
              <p>No extensions installed yet or none match your filter.</p>
              <button
                type="button"
                onClick={() => setActiveTab("marketplace")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs inline-flex items-center gap-1.5 transition"
              >
                <Store className="w-3.5 h-3.5" /> Browse Repository Catalog
              </button>
            </div>
          ) : (
            filteredInstalled.map((ext) => {
              const isEnabled = extensionStates[ext.id] ?? ext.isEnabled;
              const extCookies = allCookies.filter(
                (c) => c.provider === ext.id,
              );
              const isExpanded = expandedId === ext.id;
              const marketEntry = marketplaceMap.get(ext.id);
              const hasUpdate =
                marketEntry && marketEntry.version !== ext.version;
              const isUpdating = installingId === ext.id;

              return (
                <div
                  key={ext.id}
                  className={`admin-card space-y-4 rounded-2xl border p-5 transition-all ${
                    !isEnabled ? "opacity-60 bg-zinc-950/20" : ""
                  }`}
                >
                  {/* Row Summary Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`admin-icon-tile flex h-10 w-10 items-center justify-center rounded-xl border font-bold text-sm ${
                          isEnabled
                            ? "admin-icon-green"
                            : "bg-zinc-800 text-zinc-500 border-zinc-700"
                        }`}
                      >
                        {ext.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {ext.name}
                          </span>
                          <span className="admin-count-badge rounded-full px-2 py-0.5 text-[10px] font-medium">
                            v{ext.version}
                          </span>
                          {isEnabled ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] px-2 py-0.5 rounded-full">
                              Disabled
                            </span>
                          )}
                          {hasUpdate && (
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                              Update to v{marketEntry.version}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {ext.description || `Module ID: ${ext.id}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {/* Update Button if available */}
                      {hasUpdate && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleInstallExtension(marketEntry)}
                          className="px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer border text-xs bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                              Updating...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" /> Update
                            </>
                          )}
                        </button>
                      )}

                      {/* iOS Style Switch Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400">
                          {isEnabled ? "On" : "Off"}
                        </span>
                        <SwitchToggle
                          checked={isEnabled}
                          onChange={(next) =>
                            handleToggleExtension(ext.id, next)
                          }
                        />
                      </div>

                      {/* Uninstall Button */}
                      <button
                        type="button"
                        onClick={() => promptUninstallExtension(ext)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition cursor-pointer ml-1"
                        title="Uninstall extension"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Expand / Collapse Details */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : ext.id)
                        }
                        className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details: Matchers & Cookies */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-zinc-800/80 space-y-5">
                      {/* URL Matchers */}
                      <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50 space-y-2">
                        <span className="text-zinc-400 font-bold block">
                          URL Matchers ({ext.urlPatterns.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {ext.urlPatterns.map((pat, i) => (
                            <code
                              key={i}
                              className="text-[11px] bg-zinc-900 text-emerald-400 px-2.5 py-1 rounded-md border border-zinc-800 font-mono break-all"
                            >
                              {pat}
                            </code>
                          ))}
                        </div>
                      </div>

                      {/* Cookies Section */}
                      {ext.cookies.support && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-white flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-emerald-500" />
                                <span>Session Cookies</span>
                              </h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {ext.cookies.description ||
                                  (ext.cookies.required
                                    ? "Required: This platform requires valid session cookies to extract content."
                                    : "Optional: Configure session cookies for higher quality or restricted media.")}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAddModalProvider(ext.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Plus className="w-4 h-4" /> Add Cookie
                            </button>
                          </div>

                          {extCookies.length === 0 ? (
                            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center text-zinc-500">
                              No cookies configured for {ext.name}.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {extCookies.map((cookie) => (
                                <div
                                  key={cookie.id}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-4"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white">
                                        {cookie.name}
                                      </span>
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                                          cookie.isActive
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                                        }`}
                                      >
                                        {cookie.isActive
                                          ? "Active"
                                          : "Disabled"}
                                      </span>
                                      {cookie.failCount > 0 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                          <ShieldAlert className="w-3 h-3" />{" "}
                                          Fails: {cookie.failCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingCookie(cookie)}
                                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer text-xs"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />{" "}
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => promptDeleteCookie(cookie)}
                                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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
      )}

      {/* TAB 2: EXPLORE REPOSITORY (MARKETPLACE) */}
      {activeTab === "marketplace" && (
        <div className="space-y-4">
          {filteredMarketplace.length === 0 ? (
            <div className="p-12 text-center bg-zinc-950/40 border border-zinc-800/80 rounded-2xl text-zinc-500 space-y-2">
              <Store className="w-8 h-8 mx-auto text-zinc-600" />
              <p>No extensions found in active repositories.</p>
              <p className="text-[11px] text-zinc-600">
                Check the Repositories tab to verify your repository URLs are
                enabled.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMarketplace.map((item) => {
                const installed = installedMap.get(item.id);
                const isInstalled = Boolean(installed);
                const hasUpdate =
                  isInstalled && installed!.version !== item.version;
                const isInstalling = installingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="admin-card rounded-2xl border p-5 flex flex-col justify-between gap-4 bg-zinc-950/30 hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="admin-icon-tile flex h-10 w-10 items-center justify-center rounded-xl border font-bold text-sm admin-icon-green">
                            {item.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-sm">
                                {item.name}
                              </h3>
                              <span className="admin-count-badge rounded-full px-2 py-0.5 text-[10px] font-medium">
                                v{item.version}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-500">
                              ID: {item.id} • {(item.size / 1024).toFixed(1)} KB
                              {item.repoName && ` • Repo: ${item.repoName}`}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isInstalled && !hasUpdate && (
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Installed
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 mt-3 line-clamp-2">
                        {item.description || "No description provided."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {item.urlPatterns.length} URL matchers
                      </span>

                      {/* Action Button with Loading Spinner */}
                      {isInstalled ? (
                        hasUpdate ? (
                          <button
                            type="button"
                            disabled={isInstalling}
                            onClick={() => handleInstallExtension(item)}
                            className="px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer border text-xs bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25 flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isInstalling ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                                Updating...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" /> Update to
                                v{item.version}
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-zinc-500 text-xs">
                            Up to date
                          </span>
                        )
                      ) : (
                        <button
                          type="button"
                          disabled={isInstalling}
                          onClick={() => handleInstallExtension(item)}
                          className="px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer border text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isInstalling ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                              Installing...
                            </>
                          ) : (
                            <>
                              <DownloadCloud className="w-3.5 h-3.5" /> Install
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPOSITORIES MANAGEMENT */}
      {activeTab === "repositories" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/80">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>Extension Sources</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage extension catalogs and community third-party
                repositories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddRepoModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Repository
            </button>
          </div>

          <div className="space-y-3">
            {repositories.map((repo) => {
              const isEnabled = repoStates[repo.id] ?? repo.isEnabled;

              return (
                <div
                  key={repo.id}
                  className={`admin-card rounded-2xl border p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    !isEnabled ? "opacity-60 bg-zinc-950/20" : "bg-zinc-950/40"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {repo.name}
                      </span>
                      {repo.isOfficial ? (
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          Official
                        </span>
                      ) : (
                        <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                          Community
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-mono flex items-center gap-1 break-all">
                      <span>{repo.url}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">
                        {isEnabled ? "Active" : "Disabled"}
                      </span>
                      <SwitchToggle
                        checked={isEnabled}
                        onChange={(next) => handleToggleRepo(repo.id, next)}
                      />
                    </div>

                    {!repo.isOfficial && (
                      <button
                        type="button"
                        onClick={() => promptDeleteRepo(repo)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition cursor-pointer ml-1"
                        title="Remove repository"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Repository Modal */}
      <Modal
        isOpen={addRepoModalOpen}
        onClose={() => setAddRepoModalOpen(false)}
        maxWidth="lg"
        icon={<Globe className="w-5 h-5 text-emerald-400" />}
        title="Add Extension Repository"
        description="Enter the index JSON endpoint for a community or third-party extension repository."
      >
        <form
          action={async (formData) => {
            await addRepositoryAction(formData);
            setAddRepoModalOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Repository Name
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. My Community Scrapers"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Index JSON URL
            </label>
            <input
              type="url"
              name="url"
              required
              placeholder="https://raw.githubusercontent.com/<owner>/<repo>/repo/index.json"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddRepoModalOpen(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition cursor-pointer text-xs"
            >
              Add Repository
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Cookie Modal for Extension */}
      <Modal
        isOpen={Boolean(addModalProvider)}
        onClose={() => setAddModalProvider(null)}
        maxWidth="lg"
        icon={<KeyRound className="w-5 h-5 text-emerald-400" />}
        title={`Add Cookie for ${addModalProvider}`}
      >
        <div className="space-y-4">
          <CookieSessionWarning />
          <CurlParserBox
            onParsed={(res) =>
              applyParsedCookie("add-extension-cookie-form", res)
            }
          />

          <form
            id="add-extension-cookie-form"
            action={async (formData) => {
              await addCookieAction(formData);
              setAddModalProvider(null);
            }}
            className="space-y-4"
          >
            <input
              type="hidden"
              name="provider"
              value={addModalProvider || ""}
            />
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Account Label
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Primary Account"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Netscape Cookies Content
              </label>
              <textarea
                name="cookieContent"
                required
                rows={6}
                placeholder="# Netscape HTTP Cookie File&#10;.instagram.com TRUE / FALSE 1750000000 sessionid 12345..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddModalProvider(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition cursor-pointer text-xs"
              >
                Save Cookie
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Cookie Modal */}
      <Modal
        isOpen={Boolean(editingCookie)}
        onClose={() => setEditingCookie(null)}
        maxWidth="lg"
        icon={<Edit3 className="w-5 h-5 text-emerald-400" />}
        title={`Edit Cookie: ${editingCookie?.name}`}
      >
        {editingCookie && (
          <div className="space-y-4">
            <CurlParserBox
              onParsed={(res) =>
                applyParsedCookie("edit-extension-cookie-form", res)
              }
            />

            <form
              id="edit-extension-cookie-form"
              action={async (formData) => {
                await updateCookieAction(formData);
                setEditingCookie(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingCookie.id} />
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Account Label
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingCookie.name}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Netscape Cookies Content
                </label>
                <textarea
                  name="cookieContent"
                  required
                  rows={6}
                  defaultValue={editingCookie.cookieContent}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCookie(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition cursor-pointer text-xs"
                >
                  Update Cookie
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Global Custom Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
