# MediaDL Decoupled Extensions Architecture

In MediaDL, platform-specific scrapers and extractors are **decoupled** from the core application and maintained in the external repository: [`mediadl-extensions`](https://github.com/fiand1996/mediadl-extensions).

---

## 1. How It Works

1. **External Repository (`mediadl-extensions`)**:
   - Community and official scrapers are developed, tested, and compiled into standalone JavaScript bundles (`dist/<id>.js`) with a repository catalog (`dist/index.json`).
2. **Admin Marketplace & Dynamic Management**:
   - Administrators can browse, install, toggle, update, and uninstall extensions with 1-click in the Admin Dashboard (`/admin/extensions`).
   - Custom third-party repository URLs are supported (Mihon-style).
3. **Sandboxed Runtime Execution (`lib/extensionRuntime.ts`)**:
   - Installed extensions are stored in the database (`installed_extensions`) and executed inside an isolated Node.js VM context without access to `process.env` or server files.
4. **Dynamic Registry (`lib/extensionRegistry.ts`)**:
   - Dynamically routes incoming download requests to the matching active extension based on URL regex patterns.
5. **Contract Interfaces (`extensions/types.ts`)**:
   - Defines the standard `DownloaderExtension`, `ExtensionManifest`, and `ExtensionContext` interfaces.
