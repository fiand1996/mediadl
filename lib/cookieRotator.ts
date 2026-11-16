import { db } from "@/db";
import { cookiesConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

// Cookie Rotation Function: Get active cookie for provider from Database only
export function getActiveCookieForProvider(provider: string) {
  // Get all active cookies for the provider from database
  const activeCookies = db
    .select()
    .from(cookiesConfig)
    .where(eq(cookiesConfig.provider, provider))
    .all()
    .filter(c => c.isActive);

  if (activeCookies.length === 0) return null;

  // Sort by lowest failCount and oldest lastUsedAt
  activeCookies.sort((a, b) => {
    if (a.failCount !== b.failCount) {
      return a.failCount - b.failCount;
    }
    const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    return timeA - timeB;
  });

  return activeCookies[0];
}

// Record cookie failure so the system can fallback to another cookie
export function markCookieFail(cookieId: number) {
  const target = db.select().from(cookiesConfig).where(eq(cookiesConfig.id, cookieId)).get();
  if (target) {
    const newFailCount = target.failCount + 1;
    // Disable temporarily if it fails 3 times consecutively
    const isActive = newFailCount < 3;
    db.update(cookiesConfig)
      .set({ failCount: newFailCount, isActive })
      .where(eq(cookiesConfig.id, cookieId))
      .run();
  }
}

// Record cookie success (reset failCount)
export function markCookieSuccess(cookieId: number) {
  db.update(cookiesConfig)
    .set({ failCount: 0, lastUsedAt: new Date(), isActive: true })
    .where(eq(cookiesConfig.id, cookieId))
    .run();
}
