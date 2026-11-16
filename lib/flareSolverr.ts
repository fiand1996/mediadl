export interface FlareSolverrConfig {
  enabled: boolean;
  url: string;
  timeout: number;
  sessionName: string;
}

export function getFlareSolverrConfig(): FlareSolverrConfig {
  const url = process.env.FLARESOLVERR_URL || "";
  const enabled = process.env.FLARESOLVERR_ENABLED === "true" && Boolean(url);

  return {
    enabled,
    url,
    timeout: parseInt(process.env.FLARESOLVERR_TIMEOUT || "60000", 10),
    sessionName: process.env.FLARESOLVERR_SESSION_NAME || "default",
  };
}

interface FlareSolverrCookie {
  domain: string;
  name: string;
  value: string;
  path: string;
}

interface FlareSolverrResponse {
  status: string;
  message: string;
  solution: {
    url: string;
    status: number;
    response: string;
    headers?: Record<string, string>;
    cookies?: FlareSolverrCookie[];
    userAgent?: string;
    screenshot?: string;
  };
}

export const CLOUDFLARE_SIGNATURES = [
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

export function isAntiBotChallenge(
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

  // 1. JSON responses are API payloads (e.g. Instagram, TikTok REST APIs), NEVER Cloudflare HTML challenge pages
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
    const hasSignature = CLOUDFLARE_SIGNATURES.some((sig) => lower.includes(sig));
    if (hasSignature) {
      return true;
    }
  }

  // 4. Cloudflare challenge statuses (403, 503, 429) accompanied by Cloudflare server/cf-ray headers
  const isCfStatus = status === 403 || status === 503 || status === 429;
  if (isCfStatus && headers) {
    const server = headers.get("server")?.toLowerCase() || "";
    const hasCfHeader = server.includes("cloudflare") || headers.has("cf-ray");
    const isHtmlOrEmpty = !contentType || contentType.includes("text/html");

    // Only treat as challenge if it has Cloudflare headers and HTML (or no body inspection yet)
    if (hasCfHeader && isHtmlOrEmpty) {
      return true;
    }
  }

  return false;
}

export async function executeFlareSolverrCommand(
  config: FlareSolverrConfig,
  cmdBody: Record<string, any>
): Promise<FlareSolverrResponse> {
  const send = async (payload: Record<string, any>) => {
    return await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const initialPayload = {
    ...cmdBody,
    session: config.sessionName,
    maxTimeout: config.timeout,
  };

  const response = await send(initialPayload);
  if (!response.ok) {
    throw new Error(`FlareSolverr service failed with HTTP ${response.status}`);
  }

  let data = (await response.json()) as FlareSolverrResponse;

  // If session does not exist, try creating it, or retry without session
  if (data.status === "error" && typeof data.message === "string" && data.message.toLowerCase().includes("session")) {
    try {
      await send({ cmd: "sessions.create", session: config.sessionName });
      const retryRes = await send(initialPayload);
      if (retryRes.ok) {
        data = (await retryRes.json()) as FlareSolverrResponse;
      }
    } catch {
      // Fallback: send without session
      const { session, ...noSessionPayload } = initialPayload;
      const retryRes = await send(noSessionPayload);
      if (retryRes.ok) {
        data = (await retryRes.json()) as FlareSolverrResponse;
      }
    }
  }

  return data;
}

export async function fetchWithFlareSolverr(targetUrl: string): Promise<{ status: number; text: string; headers?: Record<string, string> }> {
  const config = getFlareSolverrConfig();

  const data = await executeFlareSolverrCommand(config, {
    cmd: "request.get",
    url: targetUrl,
  });

  if (data.status !== "ok" || !data.solution) {
    throw new Error(`FlareSolverr error: ${data.message || "Unknown error"}`);
  }

  return {
    status: data.solution.status,
    text: data.solution.response,
    headers: data.solution.headers,
  };
}

export async function getFlareSolverrSessionCookies(targetUrl: string): Promise<{ cookieHeader: string; userAgent: string }> {
  const config = getFlareSolverrConfig();

  const data = await executeFlareSolverrCommand(config, {
    cmd: "request.get",
    url: targetUrl,
  });

  if (data.status !== "ok" || !data.solution) {
    throw new Error(`FlareSolverr error: ${data.message || "Unknown error"}`);
  }

  const cookies = (data.solution.cookies || []) as FlareSolverrCookie[];
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const userAgent = data.solution.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

  return { cookieHeader, userAgent };
}

export async function fetchImageViaFlareSolverr(imageUrl: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const config = getFlareSolverrConfig();

  const data = await executeFlareSolverrCommand(config, {
    cmd: "request.get",
    url: imageUrl,
    returnScreenshot: true,
  });

  if (data.status !== "ok" || !data.solution || !data.solution.screenshot) {
    throw new Error(`FlareSolverr image error: ${data.message || "No screenshot returned"}`);
  }

  const base64Data = data.solution.screenshot;
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  let contentType = "image/jpeg";
  if (imageUrl.endsWith(".png")) contentType = "image/png";
  else if (imageUrl.endsWith(".webp")) contentType = "image/webp";

  return { buffer: bytes.buffer, contentType };
}
