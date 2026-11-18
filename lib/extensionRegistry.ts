import { DownloaderExtension, ExtensionManifest } from "@/extensions/types";
import { db } from "@/db";
import { installedExtensions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { executeExtensionBundle } from "./extensionRuntime";

// Cache compiled instances by extension ID and updatedAt timestamp
// so we don't re-run vm.runInContext on every request, while immediately
// picking up new installs, updates, or toggles from SQLite without stale worker memory.
const compiledInstances = new Map<string, { updatedAt: number; instance: DownloaderExtension }>();

export function invalidateRegistryCache(): void {
  compiledInstances.clear();
}

export class DynamicExtensionRegistry {
  public getActiveExtensions(): DownloaderExtension[] {
    try {
      const rows = db
        .select()
        .from(installedExtensions)
        .where(eq(installedExtensions.isEnabled, true))
        .all();

      const activeIds = new Set(rows.map((r) => r.id));

      // Remove uninstalled or disabled extensions from memory cache
      for (const id of compiledInstances.keys()) {
        if (!activeIds.has(id)) {
          compiledInstances.delete(id);
        }
      }

      const instances: DownloaderExtension[] = [];

      for (const row of rows) {
        const rowUpdatedAt =
          row.updatedAt instanceof Date ? row.updatedAt.getTime() : new Date(row.updatedAt).getTime();
        const cached = compiledInstances.get(row.id);

        if (cached && cached.updatedAt === rowUpdatedAt) {
          instances.push(cached.instance);
          continue;
        }

        try {
          const ext = executeExtensionBundle(row.bundleCode, row.id);
          // Ensure urlPatterns in manifest are proper RegExp instances
          if (row.urlPatterns) {
            try {
              const rawPatterns = JSON.parse(row.urlPatterns) as string[];
              ext.manifest.urlPatterns = rawPatterns.map((p) => new RegExp(p));
            } catch {
              // fallback to manifest's internal patterns
            }
          }
          compiledInstances.set(row.id, { updatedAt: rowUpdatedAt, instance: ext });
          instances.push(ext);
        } catch (err) {
          console.error(`Failed to load installed extension [${row.id}]:`, err);
        }
      }

      return instances;
    } catch (err) {
      console.error("Failed to query installed_extensions from database:", err);
      return [];
    }
  }

  public findExtension(url: string, disabledIds: Set<string> = new Set()): DownloaderExtension | null {
    const extensions = this.getActiveExtensions();
    for (const ext of extensions) {
      if (disabledIds.has(ext.manifest.id)) continue;
      for (const pattern of ext.manifest.urlPatterns) {
        if (pattern.test(url)) {
          return ext;
        }
      }
    }
    return null;
  }

  public getAllExtensionsManifests(): ExtensionManifest[] {
    return this.getActiveExtensions().map((ext) => ext.manifest);
  }

  public findExtensionByDomain(hostname: string, disabledIds: Set<string> = new Set()): DownloaderExtension | null {
    const extensions = this.getActiveExtensions();
    for (const ext of extensions) {
      if (disabledIds.has(ext.manifest.id)) continue;
      if (ext.manifest.allowedImageDomains) {
        for (const domain of ext.manifest.allowedImageDomains) {
          if (hostname === domain || hostname.endsWith(`.${domain}`)) {
            return ext;
          }
        }
      }
    }
    return null;
  }
}

export const registry = new DynamicExtensionRegistry();
