import { db } from "@/db";
import { installedExtensions } from "@/db/schema";
import { getInstalledExtensionsList } from "./extensionLoader";

export function invalidateExtensionStatusCache(): void {
  // Direct SQLite read is ultra-fast (<0.05ms) and always 100% in sync across workers
}

export function getExtensionStatusMap(): Record<string, boolean> {
  try {
    const list = db
      .select({ id: installedExtensions.id, isEnabled: installedExtensions.isEnabled })
      .from(installedExtensions)
      .all();
    const map: Record<string, boolean> = {};
    for (const item of list) {
      map[item.id] = item.isEnabled;
    }
    return map;
  } catch {
    return {};
  }
}

export function getManagedExtensions() {
  return getInstalledExtensionsList();
}

export function isExtensionEnabled(id: string): boolean {
  const statusMap = getExtensionStatusMap();
  return statusMap[id] !== false;
}
