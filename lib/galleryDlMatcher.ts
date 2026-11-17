import gallerySitesData from "./metadata/galleryDlSupportedSites.json" with { type: "json" };

export interface GallerySiteInfo {
  id: string;
  name: string;
  url: string;
  capabilities: string;
  authentication: string;
  domain: string;
}

interface DomainIndexEntry {
  domain: string;
  site: GallerySiteInfo;
}

function extractDomain(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

// In-memory indexing for fast 0ms domain matching
const domainMap = new Map<string, GallerySiteInfo>();
const domainList: DomainIndexEntry[] = [];

for (const rawSite of gallerySitesData) {
  const domain = extractDomain(rawSite.url);
  if (domain) {
    const siteInfo: GallerySiteInfo = {
      ...rawSite,
      domain,
    };
    domainMap.set(domain, siteInfo);
    domainList.push({ domain, site: siteInfo });
  }
}

// Sort domains by length descending so longer/more specific subdomains match first
domainList.sort((a, b) => b.domain.length - a.domain.length);

/**
 * Checks if a given target URL's domain is in gallery-dl's supported sites list.
 */
export function matchGalleryDlSite(targetUrl: string): GallerySiteInfo | null {
  const targetHost = extractDomain(targetUrl);
  if (!targetHost) return null;

  // 1. Direct exact match
  const exact = domainMap.get(targetHost);
  if (exact) return exact;

  // 2. Subdomain match (e.g. cdn.danbooru.donmai.us or i.imgur.com)
  for (const entry of domainList) {
    if (targetHost === entry.domain || targetHost.endsWith(`.${entry.domain}`)) {
      return entry.site;
    }
  }

  return null;
}

/**
 * Returns true if targetUrl is supported by gallery-dl.
 */
export function isGalleryDlSupported(targetUrl: string): boolean {
  return matchGalleryDlSite(targetUrl) !== null;
}
