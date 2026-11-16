# Extensions Architecture & Registry System

This directory houses the modular extension architecture of **Mediahub**. Each supported social media or media platform is implemented as an independent extension plugin.

---

## 1. Core Concepts & Architecture

Instead of monolithically hardcoding platform scrapers into the backend, **Mediahub** uses an extensible plugin registry pattern:
- **Base Extension (`extensions/core/base.ts`)**: Provides standardized HTTP request helpers, cookie injection, and proxy wrapping capabilities.
- **Extension Interface (`extensions/types.ts`)**: Enforces a strict contract (`manifest`, `extract()`, and optional header overrides) for every plugin.
- **Registry (`extensions/registry.ts`)**: Automatically discovers and dispatches incoming download requests to the correct platform extension based on URL regex patterns.

---

## 2. Directory Structure

- `core/`: Base abstract classes and shared utilities for network requests and error handling.
- `instagram/`: Dedicated plugin for parsing Instagram Reels, Stories, Posts, and Carousels via internal mobile APIs.
- `pixiv/`: Dedicated plugin for parsing Pixiv illustrations and multi-page manga galleries via Pixiv JSON AJAX endpoints.
- `registry.ts`: Central routing registry matching URLs to corresponding extensions.
- `types.ts`: TypeScript interfaces defining manifests, context, and post result payloads.
