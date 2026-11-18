import vm from "node:vm";
import crypto from "node:crypto";
import url from "node:url";
import buffer from "node:buffer";
import stream from "node:stream";
import { DownloaderExtension } from "@/extensions/types";

const allowedModules: Record<string, unknown> = {
  crypto,
  url,
  buffer,
  stream,
};

type ExtensionLike = {
  extract?: unknown;
  manifest?: unknown;
};

/**
 * Executes an extension JavaScript bundle inside an isolated Node.js VM context.
 *
 * Security & Sandboxing:
 * - NO access to `process` (prevents reading `process.env` or executing system calls).
 * - NO access to filesystem (`fs`), `child_process`, or arbitrary networking (`net`).
 * - Whitelists standard Web APIs (fetch, Response, Request, Headers, URL) and safe Node builtins (crypto, buffer, stream).
 */
export function executeExtensionBundle(
  bundleCode: string,
  extensionId?: string,
): DownloaderExtension {
  const sandboxModule = { exports: {} as Record<string, unknown> };
  const sandboxExports: Record<string, unknown> = {};

  const sandbox: Record<string, unknown> = {
    module: sandboxModule,
    exports: sandboxExports,
    console,
    fetch,
    Response,
    Request,
    Headers,
    URL,
    URLSearchParams,
    TextDecoder,
    TextEncoder,
    atob,
    btoa,
    Buffer,
    setTimeout,
    clearTimeout,
    require: (moduleName: string) => {
      if (moduleName in allowedModules) {
        return allowedModules[moduleName];
      }
      throw new Error(
        `Module '${moduleName}' is not permitted in extension sandbox.`,
      );
    },
  };

  const context = vm.createContext(sandbox);

  try {
    vm.runInContext(bundleCode, context, {
      timeout: 10000, // 10 second script evaluation timeout
      displayErrors: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to evaluate extension bundle${extensionId ? ` [${extensionId}]` : ""}: ${message}`,
    );
  }

  const exported = sandboxModule.exports.default || sandboxModule.exports;
  const instance =
    exported && typeof exported === "object"
      ? (exported as ExtensionLike)
      : null;

  if (
    !instance ||
    typeof instance.extract !== "function" ||
    !instance.manifest
  ) {
    throw new Error(
      `Invalid extension bundle${extensionId ? ` [${extensionId}]` : ""}: must export an instance conforming to DownloaderExtension interface with 'manifest' and 'extract' method.`,
    );
  }

  return instance as DownloaderExtension;
}
