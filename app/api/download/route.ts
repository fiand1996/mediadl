import { NextResponse } from "next/server";
import { db } from "@/db";
import { fetchLogs, rateLimits } from "@/db/schema";
import { getActiveCookieForProvider, markCookieFail, markCookieSuccess } from "@/lib/cookieRotator";
import { getActiveCookieManagerForUrl } from "@/lib/ytdlpCookieRotator";
import { getActiveGalleryDlCookieForUrl } from "@/lib/galleryDlCookieRotator";
import { registry } from "@/extensions/registry";
import { fetchYtDlpMetadataWithCookies, extractAllFormats } from "@/lib/ytdlpCore";
import { isGalleryDlSupported } from "@/lib/galleryDlMatcher";
import { fetchGalleryDlMetadataWithCookies } from "@/lib/galleryDlCore";
import { lt } from "drizzle-orm";

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15; // Max 15 requests per minute per client

interface MemoryLimitEntry {
  count: number;
  resetTime: number;
}

const memoryRateLimit = new Map<string, MemoryLimitEntry>();
let lastCleanupTime = Date.now();
const CLEANUP_INTERVAL = 60 * 1000; // Cleanup memory & db at most once every 60s

function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();

  // Periodic lazy cleanup (once every 60s instead of blocking disk I/O on every request)
  if (now - lastCleanupTime > CLEANUP_INTERVAL) {
    lastCleanupTime = now;
    for (const [key, entry] of memoryRateLimit.entries()) {
      if (now > entry.resetTime) {
        memoryRateLimit.delete(key);
      }
    }
    try {
      db.delete(rateLimits).where(lt(rateLimits.resetTime, now)).run();
    } catch {
      // Ignore background cleanup error
    }
  }

  const existing = memoryRateLimit.get(clientKey);

  if (!existing || now > existing.resetTime) {
    memoryRateLimit.set(clientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  existing.count += 1;
  return true;
}

export async function GET(request: Request) {
  // 1. Rate Limiting Protection based on Client IP + Browser Fingerprint Hash
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "";
  const acceptLanguage = request.headers.get("accept-language") || "";
  
  const rawKey = `${clientIp}_${userAgent}_${acceptLanguage}`;
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    const char = rawKey.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const clientKey = `${clientIp}_${Math.abs(hash)}`;

  if (!checkRateLimit(clientKey)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  // 2. CSRF / Same-Origin / User-Agent Validation (Anti-Bot / Abuse protection)
  if (!userAgent.trim() || userAgent.toLowerCase().includes("python-requests") || userAgent.toLowerCase().includes("curl/") || userAgent.toLowerCase().includes("postman")) {
    return NextResponse.json(
      { success: false, error: "Access denied." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    db.insert(fetchLogs).values({
      url: "unknown",
      provider: "unknown",
      status: "error",
      statusCode: 400,
      errorMessage: "Missing 'url' parameter",
    }).run();

    return NextResponse.json({ success: false, error: "Missing 'url' parameter" }, { status: 400 });
  }

  // 3. Find extension from Registry or fallback to yt-dlp
  const extension = registry.findExtension(targetUrl);
  let successResult = null;
  const primaryProviderId = extension ? extension.manifest.id : "yt-dlp";
  let resolvedProviderId = primaryProviderId;
  let activeCookie: { id: number; name: string; cookieContent: string } | null = null;
  let lastError = "";

  if (extension) {
    activeCookie = extension.manifest.cookies.support ? getActiveCookieForProvider(primaryProviderId) : null;

    let attempts = 0;
    const maxAttempts = extension.manifest.cookies.support ? 3 : 1;

    while (attempts < maxAttempts) {
      try {
        successResult = await extension.extract(targetUrl, {
          getCookie: async () => {
            if (!activeCookie) return null;
            return activeCookie.cookieContent;
          },
        });

        if (activeCookie) {
          markCookieSuccess(activeCookie.id);
        }
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        if (activeCookie) {
          markCookieFail(activeCookie.id);
          const nextCookie = getActiveCookieForProvider(primaryProviderId);
          if (!nextCookie || nextCookie.id === activeCookie.id) {
            break;
          }
          activeCookie = nextCookie;
        } else {
          break;
        }
        attempts++;
      }
    }

    // Terminating Fallback: If an extension owns this URL, it has exclusive authority.
    // Never fall back to gallery-dl or yt-dlp on failure to prevent silent degradation and cookie confusion.
    if (!successResult) {
      db.insert(fetchLogs).values({
        url: targetUrl,
        provider: primaryProviderId,
        status: "error",
        statusCode: 500,
        errorMessage: lastError,
        cookieUsed: activeCookie?.name || null,
      }).run();

      return NextResponse.json(
        { success: false, error: lastError || `${extension.manifest.name} extraction failed.` },
        { status: 500 }
      );
    }
  }

  // 4. Priority 2: gallery-dl (only if no extension claimed the URL and domain is in galleryDlSupportedSites.json)
  let activeGdlCookie: { id: number; name: string; cookieContent: string } | null = null;
  if (!extension && isGalleryDlSupported(targetUrl)) {
    try {
      activeGdlCookie = getActiveGalleryDlCookieForUrl(targetUrl);
      const gdlCookie = activeGdlCookie?.cookieContent || null;

      successResult = await fetchGalleryDlMetadataWithCookies(targetUrl, gdlCookie);

      if (activeGdlCookie) {
        markCookieSuccess(activeGdlCookie.id);
      }
      resolvedProviderId = "gallery-dl";
    } catch (gdlErr: unknown) {
      if (activeGdlCookie) {
        markCookieFail(activeGdlCookie.id);
      }
      lastError = gdlErr instanceof Error ? gdlErr.message : String(gdlErr);

      // Do NOT fall back to yt-dlp if gallery-dl failed on a recognized gallery site
      db.insert(fetchLogs).values({
        url: targetUrl,
        provider: "gallery-dl",
        status: "error",
        statusCode: 500,
        errorMessage: lastError,
        cookieUsed: activeGdlCookie?.name || null,
      }).run();

      return NextResponse.json({ success: false, error: lastError || "gallery-dl extraction failed." }, { status: 500 });
    }
  }

  // 5. Priority 3: yt-dlp universal engine fallback (only for URLs not handled by extensions and not claimed by gallery-dl)
  let activeCookieManager: { id: number; name: string; cookieContent: string } | null = null;
  if (!extension && !isGalleryDlSupported(targetUrl)) {
    try {
      activeCookieManager = getActiveCookieManagerForUrl(targetUrl);
      const ytCookie = activeCookieManager?.cookieContent || null;

      const metadata = await fetchYtDlpMetadataWithCookies(targetUrl, ytCookie);
      const formats = extractAllFormats(metadata.formats || [], targetUrl);

      if (formats.length === 0) {
        throw new Error("yt-dlp could not resolve any media formats for this URL.");
      }

      if (activeCookieManager) {
        markCookieSuccess(activeCookieManager.id);
      }

      resolvedProviderId = "yt-dlp";
      const bestFormat = formats[0];
      const timestamp = metadata.timestamp
        ? new Date(metadata.timestamp * 1000).toISOString()
        : metadata.release_timestamp
          ? new Date(metadata.release_timestamp * 1000).toISOString()
          : new Date().toISOString();

      successResult = {
        id: metadata.id || targetUrl,
        platform: "Video",
        author: {
          username: metadata.uploader || "unknown_uploader",
          avatar: "",
          verified: false,
        },
        caption: metadata.title || metadata.description || "",
        mediaType: "single_video" as const,
        items: [
          {
            id: metadata.id || targetUrl,
            type: "video" as const,
            url: bestFormat.url,
            thumbnail: metadata.thumbnail || "",
            quality: bestFormat.quality,
            duration: metadata.duration ? `${metadata.duration}s` : undefined,
            formats: formats,
          },
        ],
        timestamp,
      };
    } catch (ytErr: unknown) {
      if (activeCookieManager) {
        markCookieFail(activeCookieManager.id);
      }
      if (!lastError) {
        lastError = ytErr instanceof Error ? ytErr.message : String(ytErr);
      }
    }
  }

  const resolvedCookieName = activeCookie?.name || activeGdlCookie?.name || activeCookieManager?.name || null;

  if (!successResult) {
    db.insert(fetchLogs).values({
      url: targetUrl,
      provider: primaryProviderId,
      status: "error",
      statusCode: 500,
      errorMessage: lastError,
      cookieUsed: resolvedCookieName,
    }).run();

    return NextResponse.json({ success: false, error: lastError || "Extraction failed." }, { status: 500 });
  }

  db.insert(fetchLogs).values({
    url: targetUrl,
    provider: resolvedProviderId,
    status: "success",
    statusCode: 200,
    cookieUsed: resolvedCookieName,
  }).run();

  return NextResponse.json({
    success: true,
    result: successResult,
    cookieUsed: resolvedCookieName,
  });
}
