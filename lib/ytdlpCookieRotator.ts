import { db } from "@/db";
import { cookiesConfig } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Get active yt-dlp cookie matching target domain or global
export function getActiveCookieManagerForUrl(
  targetUrl: string,
): { id: number; name: string; cookieContent: string } | null {
  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Select all active cookies for yt-dlp
    const activeCookies = db
      .select()
      .from(cookiesConfig)
      .where(
        and(
          eq(cookiesConfig.provider, "yt-dlp"),
          eq(cookiesConfig.isActive, true),
        ),
      )
      .all();

    if (activeCookies.length === 0) return null;

    // Filter cookies matching the target hostname or global/empty domains
    const matching = activeCookies.filter((c) => {
      if (!c.domains || !c.domains.trim()) return true; // Global cookie applies everywhere
      const domainsList = c.domains
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      return domainsList.some(
        (d) => hostname === d || hostname.endsWith(`.${d}`),
      );
    });

    if (matching.length === 0) return null;

    // Sort by lowest failCount and oldest lastUsedAt (rotation)
    matching.sort((a, b) => {
      if (a.failCount !== b.failCount) {
        return a.failCount - b.failCount;
      }
      const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
      return timeA - timeB;
    });

    return matching[0];
  } catch {
    return null;
  }
}
