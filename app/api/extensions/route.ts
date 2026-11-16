import { NextResponse } from "next/server";
import { registry } from "@/extensions/registry";

export async function GET() {
  const manifests = registry.getAllExtensions();
  // Return all urlPatterns as string arrays so frontend can dynamically test them without any hardcoded domains
  const patterns = manifests.map(m => ({
    id: m.id,
    urlPatterns: m.urlPatterns.map(p => p.source)
  }));

  return NextResponse.json({ success: true, patterns });
}
