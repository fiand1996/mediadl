import { db } from "@/db";
import { extensionStates } from "@/db/schema";
import { registry } from "@/extensions/registry";

export function getExtensionStatusMap(): Record<string, boolean> {
  try {
    const states = db.select().from(extensionStates).all();
    const map: Record<string, boolean> = {};
    for (const s of states) {
      map[s.id] = s.isEnabled;
    }
    return map;
  } catch {
    return {};
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
