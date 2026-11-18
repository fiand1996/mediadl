import { NextResponse } from "next/server";
import { registry } from "@/extensions/registry";
import { getExtensionStatusMap } from "@/lib/extensionManager";

export async function GET() {
  const manifests = registry.getAllExtensionsManifests();
  const statusMap = getExtensionStatusMap();

  // Return urlPatterns for active/enabled extensions only
  const activeManifests = manifests.filter((m: { id: string }) => statusMap[m.id] !== false);

  const patterns = activeManifests.map((m: { id: string; urlPatterns: RegExp[] }) => ({
    id: m.id,
    urlPatterns: m.urlPatterns.map((p: RegExp) => p.source)
  }));

  return NextResponse.json({ success: true, patterns });
}
