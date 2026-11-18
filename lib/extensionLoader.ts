import { db } from "@/db";
import { installedExtensions, extensionRepositories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { invalidateRegistryCache } from "./extensionRegistry";
import { executeExtensionBundle } from "./extensionRuntime";

export interface RepoExtensionEntry {
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
  allowedImageDomains?: string[];
  imageReferer?: string;
  bundleFile: string;
  sha256: string;
  size: number;
  updatedAt: string;
  downloadUrl?: string;
  repoName?: string;
}

export interface RepoIndex {
  version: number;
  generatedAt: string;
  count: number;
  extensions: RepoExtensionEntry[];
}

export interface ExtensionRepoItem {
  id: string;
  name: string;
  url: string;
  isEnabled: boolean;
  isOfficial: boolean;
  createdAt: Date;
}

export const OFFICIAL_REPO_URL =
  process.env.NEXT_PUBLIC_EXTENSIONS_REPO_URL ||
  "https://raw.githubusercontent.com/fiand1996/mediadl-extensions/repo/index.json";

/**
 * Ensures the official repository is registered in extension_repositories table.
 */
export function ensureDefaultRepository(): void {
  try {
    const repos = db.select().from(extensionRepositories).all();
    if (repos.length === 0) {
      db.insert(extensionRepositories)
        .values({
          id: "official",
          name: "MediaDL Official Extensions",
          url: OFFICIAL_REPO_URL,
          isEnabled: true,
          createdAt: new Date(),
        })
        .run();
    }
  } catch (err) {
    console.error("Failed to ensure default repository:", err);
  }
}

/**
 * Returns all configured extension repositories.
 */
export function getExtensionRepositoriesList(): ExtensionRepoItem[] {
  ensureDefaultRepository();
  const repos = db.select().from(extensionRepositories).all();

  return repos.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    isEnabled: r.isEnabled,
    isOfficial: r.id === "official",
    createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
  }));
}

/**
 * Adds a new custom extension repository URL (Mihon-style).
 */
export function addExtensionRepository(name: string, url: string): void {
  const cleanUrl = url.trim();
  const cleanName = name.trim();

  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    throw new Error("Repository URL must start with http:// or https://");
  }

  const id = `repo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  db.insert(extensionRepositories)
    .values({
      id,
      name: cleanName || "Custom Repository",
      url: cleanUrl,
      isEnabled: true,
      createdAt: new Date(),
    })
    .run();
}

/**
 * Toggles a repository active status.
 */
export function toggleExtensionRepository(id: string, isEnabled: boolean): void {
  db.update(extensionRepositories)
    .set({ isEnabled })
    .where(eq(extensionRepositories.id, id))
    .run();
}

/**
 * Deletes a custom repository. Official repository cannot be deleted.
 */
export function deleteExtensionRepository(id: string): void {
  if (id === "official") {
    throw new Error("Official repository cannot be deleted.");
  }
  db.delete(extensionRepositories).where(eq(extensionRepositories.id, id)).run();
}

/**
 * Returns all installed extensions from SQLite.
 */
export function getInstalledExtensionsList() {
  ensureDefaultRepository();
  const rows = db.select().from(installedExtensions).all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    version: row.version,
    description: row.description,
    urlPatterns: JSON.parse(row.urlPatterns || "[]") as string[],
    cookies: {
      support: row.cookiesSupport,
      required: row.cookiesRequired,
      description: row.cookiesDescription || undefined,
    },
    allowedImageDomains: JSON.parse(row.allowedImageDomains || "[]") as string[],
    imageReferer: row.imageReferer || undefined,
    isEnabled: row.isEnabled,
    installedAt: row.installedAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Installs or updates an extension bundle into SQLite.
 */
export function installOrUpdateExtension(
  manifest: RepoExtensionEntry,
  bundleCode: string
): void {
  // Test execute to verify bundle validity before saving to database
  executeExtensionBundle(bundleCode, manifest.id);

  const now = new Date();
  const existing = db.select().from(installedExtensions).where(eq(installedExtensions.id, manifest.id)).get();

  if (existing) {
    db.update(installedExtensions)
      .set({
        name: manifest.name,
        version: manifest.version,
        description: manifest.description || "",
        urlPatterns: JSON.stringify(manifest.urlPatterns),
        cookiesSupport: manifest.cookies.support,
        cookiesRequired: manifest.cookies.required,
        cookiesDescription: manifest.cookies.description || "",
        allowedImageDomains: JSON.stringify(manifest.allowedImageDomains || []),
        imageReferer: manifest.imageReferer || "",
        bundleCode,
        bundleSha256: manifest.sha256,
        updatedAt: now,
      })
      .where(eq(installedExtensions.id, manifest.id))
      .run();
  } else {
    db.insert(installedExtensions)
      .values({
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description || "",
        urlPatterns: JSON.stringify(manifest.urlPatterns),
        cookiesSupport: manifest.cookies.support,
        cookiesRequired: manifest.cookies.required,
        cookiesDescription: manifest.cookies.description || "",
        allowedImageDomains: JSON.stringify(manifest.allowedImageDomains || []),
        imageReferer: manifest.imageReferer || "",
        bundleCode,
        bundleSha256: manifest.sha256,
        isEnabled: true,
        installedAt: now,
        updatedAt: now,
      })
      .run();
  }

  invalidateRegistryCache();
}

/**
 * Uninstalls an extension from SQLite.
 */
export function uninstallExtension(id: string): void {
  db.delete(installedExtensions).where(eq(installedExtensions.id, id)).run();
  invalidateRegistryCache();
}

/**
 * Toggles extension active status.
 */
export function toggleExtensionStatus(id: string, isEnabled: boolean): void {
  db.update(installedExtensions)
    .set({ isEnabled, updatedAt: new Date() })
    .where(eq(installedExtensions.id, id))
    .run();

  invalidateRegistryCache();
}

/**
 * Helper to fetch a single repo index.
 */
async function fetchSingleRepoIndex(url: string, repoName?: string): Promise<RepoExtensionEntry[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as RepoIndex;
    if (!data || !Array.isArray(data.extensions)) return [];

    const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);

    return data.extensions.map((ext) => ({
      ...ext,
      downloadUrl: ext.downloadUrl || `${baseUrl}${ext.bundleFile}`,
      repoName: repoName || ext.repoName,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetches repository index. If no specific repoUrl is given, queries all active
 * repositories in extension_repositories and merges their catalogs.
 */
export async function fetchRepositoryIndex(repoUrl?: string): Promise<RepoIndex> {
  if (repoUrl) {
    const extensions = await fetchSingleRepoIndex(repoUrl);
    return {
      version: 1,
      generatedAt: "",
      count: extensions.length,
      extensions,
    };
  }

  ensureDefaultRepository();
  const activeRepos = db
    .select()
    .from(extensionRepositories)
    .where(eq(extensionRepositories.isEnabled, true))
    .all();

  // If no repositories are active (all disabled or empty), return empty index
  if (activeRepos.length === 0) {
    return {
      version: 1,
      generatedAt: "",
      count: 0,
      extensions: [],
    };
  }

  const results = await Promise.allSettled(
    activeRepos.map((r) => fetchSingleRepoIndex(r.url, r.name))
  );

  const mergedExtensions: RepoExtensionEntry[] = [];
  const seenIds = new Set<string>();

  for (const res of results) {
    if (res.status === "fulfilled") {
      for (const ext of res.value) {
        if (!seenIds.has(ext.id)) {
          seenIds.add(ext.id);
          mergedExtensions.push(ext);
        }
      }
    }
  }

  return {
    version: 1,
    generatedAt: "",
    count: mergedExtensions.length,
    extensions: mergedExtensions,
  };
}
