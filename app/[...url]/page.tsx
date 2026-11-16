import { notFound, redirect } from "next/navigation";
import { Suspense, use } from "react";

function isValidUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    return domainRegex.test(host) || isIp;
  } catch {
    return false;
  }
}

function Redirector({ params }: { params: Promise<{ url?: string[] }> }) {
  const resolvedParams = use(params);
  const urlSegments = resolvedParams.url;

  if (!urlSegments || urlSegments.length === 0) {
    notFound();
  }

  // Join segments and decode any double/single encoding
  let rawPath = urlSegments.join("/");
  try {
    rawPath = decodeURIComponent(rawPath);
  } catch {
    // Already decoded
  }

  let fullUrl = rawPath;
  if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
    if (fullUrl.startsWith("http:/") || fullUrl.startsWith("https:/")) {
      fullUrl = fullUrl.replace(/^(https?):\/+/, "$1://");
    } else {
      fullUrl = "https://" + fullUrl;
    }
  }

  // Final cleanup if any duplicate scheme exists
  fullUrl = fullUrl.replace(/https?:\/+(https?:\/\/)/i, "$1");
  fullUrl = fullUrl.replace(/^https?:\/\/https?:\/\//i, "https://");

  if (!isValidUrl(fullUrl)) {
    notFound();
  }

  redirect(`/?url=${encodeURIComponent(fullUrl)}`);
  return null;
}

export default function CatchAllPage({
  params,
}: {
  params: Promise<{ url?: string[] }>;
}) {
  return (
    <Suspense fallback={null}>
      <Redirector params={params} />
    </Suspense>
  );
}
