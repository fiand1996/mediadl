import { NextResponse } from "next/server";
import { registry } from "@/extensions/registry";
import { getFlareSolverrConfig, getFlareSolverrSessionCookies, fetchImageViaFlareSolverr, isAntiBotChallenge } from "@/lib/flareSolverr";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  // Unwrap any accidental double-proxy wrapping or percent-encoding
  while (imageUrl && (imageUrl.startsWith("/api/proxy") || imageUrl.includes("/api/proxy?url="))) {
    const parts = imageUrl.split("url=");
    if (parts.length > 1) {
      imageUrl = decodeURIComponent(parts.slice(1).join("url="));
    } else {
      break;
    }
  }

  try {
    const parsed = new URL(imageUrl);
    const hostname = parsed.hostname;

    // Fully dynamic lookup: ask the ExtensionRegistry if any registered extension owns this image domain
    const extension = registry.findExtensionByDomain(hostname);

    if (!extension || !extension.manifest.imageReferer) {
      return NextResponse.json({ error: "Invalid or unauthorized domain" }, { status: 403 });
    }

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": extension.manifest.imageReferer,
      "Sec-Fetch-Dest": "image",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "cross-site",
    };

    let res: Response | null = null;
    let fetchError: unknown = null;

    try {
      res = await fetch(imageUrl, { headers });
    } catch (err) {
      fetchError = err;
    }

    // Lazy auto-detect: if initial fetch hits bot challenge/block, attach solver cookies or use FlareSolverr
    let needsSolver = false;
    if (fetchError) {
      const errMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      if (/cloudflare|cf-turnstile|challenges\.cloudflare/i.test(errMsg)) {
        needsSolver = true;
      }
    } else if (res) {
      let bodyText: string | undefined;
      const contentType = res.headers.get("content-type")?.toLowerCase() || "";
      // If response is HTML (even on 200 or 403), it might be a Cloudflare challenge page instead of image bytes
      if (contentType.includes("text/html") || (!contentType.startsWith("image/") && !contentType.includes("application/json"))) {
        try {
          const cloned = res.clone();
          bodyText = await cloned.text();
        } catch {
          // ignore inspection error
        }
      }
      if (isAntiBotChallenge(res, bodyText)) {
        needsSolver = true;
      }
    }

    const flareConfig = getFlareSolverrConfig();
    if (flareConfig.enabled && needsSolver) {
      try {
        // First try fetching session cookies to retry direct fetch with session
        const { cookieHeader, userAgent } = await getFlareSolverrSessionCookies(extension.manifest.imageReferer);
        const retryHeaders = { ...headers };
        if (cookieHeader) retryHeaders["Cookie"] = cookieHeader;
        if (userAgent) retryHeaders["User-Agent"] = userAgent;

        try {
          const retryRes = await fetch(imageUrl, { headers: retryHeaders });
          if (retryRes.ok) {
            res = retryRes;
          } else {
            // If direct fetch with session still fails, use full FlareSolverr image fetcher
            const { buffer, contentType } = await fetchImageViaFlareSolverr(imageUrl);
            return new NextResponse(buffer, {
              status: 200,
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
              },
            });
          }
        } catch {
          const { buffer, contentType } = await fetchImageViaFlareSolverr(imageUrl);
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
            },
          });
        }
      } catch (err) {
        // Fallback to initial res if FlareSolverr fails
      }
    }

    if (!res || !res.ok) {
      const status = res ? res.status : 500;
      return NextResponse.json({ error: `Failed to fetch image: ${status}` }, { status });
    }

    const contentType = res.headers.get("content-type") || "image/webp";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Proxy error" }, { status: 500 });
  }
}
