import { db } from "@/db";
import { extensionStates } from "@/db/schema";
import { registry } from "@/extensions/registry";

// In-memory cache for extension statuses to avoid SQLite query overhead during concurrent requests.
// Cache is automatically invalidated whenever an admin updates the extension state.
let cachedStatusMap: Record<string, boolean> | null = null;

export function invalidateExtensionStatusCache(): void {
  cachedStatusMap = null;
}

export function getExtensionStatusMap(): Record<string, boolean> {
  if (cachedStatusMap) {
    return cachedStatusMap;
  }

  try {
    const states = db.select().from(extensionStates).all();
    const map: Record<string, boolean> = {};
    for (const s of states) {
      map[s.id] = s.isEnabled;
    }
    cachedStatusMap = map;
    return map;
  } catch {
    return cachedStatusMap || {};
  }
}

export function getManagedExtensions() {
  const statusMap = getExtensionStatusMap();
  const allManifests = registry.getAllExtensionsManifests();
  
  return allManifests.map((manifest) => ({
    ...manifest,
    isEnabled: statusMap[manifest.id] !== false, // default true unless explicitly false
  }));
}

export function isExtensionEnabled(id: string): boolean {
  const statusMap = getExtensionStatusMap();
  return statusMap[id] !== false;
}
