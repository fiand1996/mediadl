import { DownloaderExtension, ExtensionContext, ExtensionManifest, PostResult } from "../types";

export abstract class BaseExtension implements DownloaderExtension {
  abstract manifest: ExtensionManifest;

  abstract extract(url: string, context: ExtensionContext): Promise<PostResult>;

  protected getDefaultHeaders(): Record<string, string> {
    return {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };
  }

  protected getCustomHeaders(url: string, context: ExtensionContext): Record<string, string> {
    return {};
  }

  protected parseNetscapeCookies(content: string): Record<string, string> {
    const lines = content.split("\n");
    const map: Record<string, string> = {};

    for (const line of lines) {
      if (line.startsWith("#") || !line.trim()) continue;
      const parts = line.split("\t");
      if (parts.length >= 7) {
        map[parts[5]] = parts[6];
      }
    }
    return map;
  }

  protected isAntiBotChallenge(
    target: Response | number,
    htmlText?: string,
    customHeaders?: Headers | Record<string, string | string[] | undefined>
  ): boolean {
    let status: number;
    let headers: Headers | null = null;
    let contentType = "";

    if (typeof target === "number") {
      status = target;
      if (customHeaders instanceof Headers) {
        headers = customHeaders;
      } else if (customHeaders && typeof customHeaders === "object") {
        headers = new Headers();
        for (const [k, v] of Object.entries(customHeaders)) {
          if (typeof v === "string") headers.set(k, v);
        }
      }
    } else {
      status = target.status;
      headers = target.headers;
    }

    if (headers) {
      contentType = headers.get("content-type")?.toLowerCase() || "";
    }

    // 1. JSON responses are API payloads (e.g. Instagram, TikTok, REST APIs), NEVER Cloudflare HTML challenge pages
    if (contentType.includes("application/json")) {
      return false;
    }

    // 2. Direct Cloudflare challenge header check
    if (headers && headers.get("cf-mitigated") === "challenge") {
      return true;
    }

    // 3. Inspect HTML text if available
    if (htmlText) {
      const lower = htmlText.toLowerCase();
      const challengeSignatures = [
        "cf-browser-verification",
        "cf_chl_opt",
        "_cf_chl_opt",
        "challenges.cloudflare.com",
        "cf-turnstile",
        "just a moment...",
        "ddos protection by cloudflare",
        "attention required! | cloudflare",
        "checking if the site connection is secure",
        "checking your browser before accessing",
        "cf-mitigated",
        "internet positif",
        "trustpositif",
      ];
      if (challengeSignatures.some((sig) => lower.includes(sig))) {
        return true;
      }
    }

    // 4. Cloudflare challenge statuses (403, 503, 429) accompanied by Cloudflare server/cf-ray headers
    const isCfStatus = status === 403 || status === 503 || status === 429;
    if (isCfStatus && headers) {
      const server = headers.get("server")?.toLowerCase() || "";
      const hasCfHeader = server.includes("cloudflare") || headers.has("cf-ray");
      const isHtmlOrEmpty = !contentType || contentType.includes("text/html");

      if (hasCfHeader && isHtmlOrEmpty) {
        return true;
      }
    }

    return false;
  }

  protected async request(
    url: string,
    context: ExtensionContext,
    options: RequestInit = {}
  ): Promise<Response> {
    const rawCookieContent = this.manifest.cookies.support && context.getCookie 
      ? await context.getCookie() 
      : null;

    if (this.manifest.cookies.required && !rawCookieContent) {
      throw new Error(`Extension [${this.manifest.id}] requires session cookies, but none are available or active.`);
    }

    let cookieString = "";
    if (rawCookieContent) {
      const cookiesMap = this.parseNetscapeCookies(rawCookieContent);
      cookieString = Object.entries(cookiesMap)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ")
        .replace(/[^\x20-\x7E]/g, ""); // Strip non-ASCII characters to prevent Headers.append invalid header value error
    }

    const headers: Record<string, string> = {
      ...this.getDefaultHeaders(),
      ...this.getCustomHeaders(url, context),
      ...(options.headers as Record<string, string> || {}),
    };

    if (cookieString) {
      headers["Cookie"] = headers["Cookie"] ? `${headers["Cookie"]}; ${cookieString}` : cookieString;
    }

    let initialResponse: Response | null = null;
    let fetchError: unknown = null;

    try {
      initialResponse = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err) {
      fetchError = err;
    }

    const flareSolverrUrl = process.env.FLARESOLVERR_URL;
    const flareEnabled = process.env.FLARESOLVERR_ENABLED === "true" && Boolean(flareSolverrUrl);

    // Determine if FlareSolverr is needed (network failure with Cloudflare keywords, bot challenge status, or challenge HTML signature)
    let needsFlareSolverr = false;
    if (fetchError) {
      const errMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      if (/cloudflare|cf-turnstile|challenges\.cloudflare/i.test(errMsg)) {
        needsFlareSolverr = true;
      }
    } else if (initialResponse) {
      let bodyText: string | undefined;
      const contentType = initialResponse.headers.get("content-type")?.toLowerCase() || "";
      // Inspect body only if not a pure JSON payload
      if (!contentType.includes("application/json")) {
        try {
          const cloned = initialResponse.clone();
          bodyText = await cloned.text();
        } catch {
          // ignore body inspection error
        }
      }
      if (this.isAntiBotChallenge(initialResponse, bodyText)) {
        needsFlareSolverr = true;
      }
    }

    if (flareEnabled && needsFlareSolverr) {
      if (!flareSolverrUrl) {
        throw new Error("FLARESOLVERR_URL environment variable is required when FlareSolverr is enabled.");
      }

      // Convert current cookies into FlareSolverr format
      const flareCookies: Array<{ name: string; value: string; domain: string }> = [];
      const currentCookie = headers["Cookie"];
      if (currentCookie) {
        try {
          const parsedUrl = new URL(url);
          currentCookie.split(";").forEach((pair) => {
            const [name, ...rest] = pair.trim().split("=");
            if (name && rest.length > 0) {
              flareCookies.push({
                name: name.trim(),
                value: rest.join("=").trim(),
                domain: parsedUrl.hostname.replace(/^www\./, "."),
              });
            }
          });
        } catch {}
      }

      const sessionName = process.env.FLARESOLVERR_SESSION_NAME || "default";
      const timeout = parseInt(process.env.FLARESOLVERR_TIMEOUT || "60000", 10);

      const makeFlareRequest = async (useSession: boolean) => {
        const body: Record<string, any> = {
          cmd: "request.get",
          url: url,
          maxTimeout: timeout,
        };
        if (useSession && sessionName) {
          body.session = sessionName;
        }
        if (flareCookies.length > 0) {
          body.cookies = flareCookies;
        }
        return await fetch(flareSolverrUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      };

      try {
        let response = await makeFlareRequest(true);
        if (response.ok) {
          let data = await response.json();
          // If session doesn't exist, try creating it or retry without session
          if (data.status === "error" && typeof data.message === "string" && data.message.toLowerCase().includes("session")) {
            try {
              await fetch(flareSolverrUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cmd: "sessions.create", session: sessionName }),
              });
              response = await makeFlareRequest(true);
              if (response.ok) {
                data = await response.json();
              }
            } catch {
              // Retry without session
              response = await makeFlareRequest(false);
              if (response.ok) {
                data = await response.json();
              }
            }
          }

          if (data.status === "ok" && data.solution) {
            return new Response(data.solution.response, {
              status: data.solution.status || 200,
              headers: data.solution.headers || {},
            });
          }
        }
      } catch (err) {
        // Fallback to initial response if FlareSolverr fails
      }
    }

    if (initialResponse) {
      return initialResponse;
    }

    if (fetchError) {
      throw fetchError;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }
}
