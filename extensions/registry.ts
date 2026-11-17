import { DownloaderExtension, ExtensionManifest } from "./types";
import { instagramExtension } from "./instagram";
import { pixivExtension } from "./pixiv";
import { pornpicsExtension } from "./pornpics";
import { babesourceExtension } from "./babesource";
import { eHentaiExtension } from "./e-hentai";
import { threeHentaiExtension } from "./3hentai";
import { cosplayteleExtension } from "./cosplaytele";

export class ExtensionRegistry {
  private extensions: DownloaderExtension[] = [
    instagramExtension,
    pixivExtension,
    pornpicsExtension,
    babesourceExtension,
    eHentaiExtension,
    threeHentaiExtension,
    cosplayteleExtension,
  ];

  public findExtension(url: string, disabledIds: Set<string> = new Set()): DownloaderExtension | null {
    for (const ext of this.extensions) {
      if (disabledIds.has(ext.manifest.id)) continue;
      for (const pattern of ext.manifest.urlPatterns) {
        if (pattern.test(url)) {
          return ext;
        }
      }
    }
    return null;
  }

  public getAllExtensionsManifests(): ExtensionManifest[] {
    return this.extensions.map((ext) => ext.manifest);
  }

  public findExtensionByDomain(hostname: string, disabledIds: Set<string> = new Set()): DownloaderExtension | null {
    for (const ext of this.extensions) {
      if (disabledIds.has(ext.manifest.id)) continue;
      if (ext.manifest.allowedImageDomains) {
        for (const domain of ext.manifest.allowedImageDomains) {
          if (hostname === domain || hostname.endsWith(`.${domain}`)) {
            return ext;
          }
        }
      }
    }
    return null;
  }

  public register(extension: DownloaderExtension) {
    this.extensions.push(extension);
  }
}

export const registry = new ExtensionRegistry();
