# Running and Environment Configuration Guide

This guide covers how to set up, configure, and run **MediaDL** in both local development environments and production environments using Docker, utilizing the official prebuilt container image `ghcr.io/fiand1996/mediadl:latest`.

---

## 📋 Table of Contents

- [Environment Variables (`.env`)](#-environment-variables-env)
- [Local Development Setup](#-local-development-setup)
- [Running with Docker & Prebuilt Image (`ghcr.io/fiand1996/mediadl:latest`)](#-running-with-docker--prebuilt-image-ghcrfiand1996mediadllatest)
- [Database Migrations & Management](#-database-migrations--management)
- [Related Documentation](#-related-documentation)

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the root directory (you can copy from `.env.example`). Here is the full reference of all supported environment variables:

| Variable                    | Type    | Default                          | Description                                                                                                                     |
| :-------------------------- | :------ | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `APP_URL`                   | String  | **Required**                     | The public base URL of your MediaDL instance. Used for server-side redirects and callbacks.                                    |
| `FFMPEG_PATH`               | String  | _Optional_                       | Absolute path to the FFmpeg binary. If provided, enables high-resolution 1080p/4K audio+video merging for `yt-dlp`.             |
| `YTDLP_PATH`                | String  | **Required (if outside Docker)** | Absolute path to the `yt-dlp` binary (required if `yt-dlp` is not available in system `PATH`).                                  |
| `AUTH_SECRET`               | String  | **Required**                     | Secret key used to encrypt Auth.js/NextAuth tokens and session data (generate with `openssl rand -base64 32`).                  |
| `AUTH_URL`                  | String  | **Required**                     | Base URL of the authentication server. Must match `APP_URL` in production.                                                      |
| `OIDC_PROVIDER`             | String  | _Optional_                       | External OIDC authentication provider: choose `"github"`, `"google"`, or `"custom"`. Leave empty for database credentials only. |
| `OIDC_ISSUER`               | String  | _Optional_                       | OIDC issuer endpoint URL when `OIDC_PROVIDER="custom"` (e.g., Keycloak, Authentik, Authelia, Zitadel).                          |
| `OIDC_CLIENT_ID`            | String  | _Optional_                       | Client ID for custom OIDC provider.                                                                                             |
| `OIDC_CLIENT_SECRET`        | String  | _Optional_                       | Client secret for custom OIDC provider.                                                                                         |
| `AUTH_GITHUB_ID`            | String  | _Optional_                       | GitHub OAuth App Client ID.                                                                                                     |
| `AUTH_GITHUB_SECRET`        | String  | _Optional_                       | GitHub OAuth App Client Secret.                                                                                                 |
| `AUTH_GOOGLE_ID`            | String  | _Optional_                       | Google OAuth Client ID.                                                                                                         |
| `AUTH_GOOGLE_SECRET`        | String  | _Optional_                       | Google OAuth Client Secret.                                                                                                     |
| `FLARESOLVERR_ENABLED`      | Boolean | `false`                          | Enable or disable FlareSolverr integration for bypassing Cloudflare bot protections (`true` or `false`).                        |
| `FLARESOLVERR_URL`          | String  | _Optional_                       | FlareSolverr server endpoint URL (e.g., `http://flaresolverr:8191`).                                                            |
| `FLARESOLVERR_TIMEOUT`      | Number  | `60000`                          | Request timeout for FlareSolverr in milliseconds.                                                                               |
| `FLARESOLVERR_SESSION_NAME` | String  | `mediadl-session`               | Persistent session name for FlareSolverr.                                                                                       |

---

## 💻 Local Development Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher (recommended package manager)
- **FFmpeg**: Optional, required if you want local video+audio format merging.

### Steps

1. **Clone the repository and install dependencies**:

   ```bash
   git clone https://github.com/fiand1996/mediadl.git
   cd mediadl
   pnpm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your configuration:

   ```bash
   cp .env.example .env
   ```

   Make sure to generate a secure `AUTH_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

3. **Initialize the Database**:
   Run Drizzle migrations to set up the SQLite database (`db/sqlite.db`):

   ```bash
   pnpm dlx drizzle-kit push
   ```

4. **Start the Development Server**:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Running with Docker & Prebuilt Image (`ghcr.io/fiand1996/mediadl:latest`)

You can run MediaDL instantly using Docker and the official prebuilt multi-architecture container image hosted on GitHub Container Registry: `ghcr.io/fiand1996/mediadl:latest`.

### Using Docker Compose

Create a `docker-compose.yml` file in your deployment directory:

```yaml
services:
  mediadl:
    image: ghcr.io/fiand1996/mediadl:latest
    container_name: mediadl
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - APP_URL=http://localhost:3000
      - AUTH_SECRET=your_super_secret_auth_key_here
      - AUTH_URL=http://localhost:3000
      - FLARESOLVERR_ENABLED=true
      - FLARESOLVERR_URL=http://flaresolverr:8191
    volumes:
      - mediadl_data:/app/db
    depends_on:
      - flaresolverr

  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:latest
    container_name: flaresolverr
    restart: unless-stopped
    ports:
      - "8191:8191"
    environment:
      - LOG_LEVEL=info
      - TZ=UTC

volumes:
  mediadl_data:
```

### Start the Docker Stack

Run the container stack in detached mode:

```bash
docker compose up -d
```

To pull the absolute latest image updates from the registry and restart:

```bash
docker compose pull
docker compose up -d --renew-anon-volumes
```

Access the web UI at `http://localhost:3000`.

---

## 🗄️ Database Migrations & Management

MediaDL uses SQLite with Drizzle ORM. Database files are persisted in the `/app/db` directory (mapped via Docker volume `mediadl_data`).

- **Push Schema Changes**:

  ```bash
  pnpm db:push
  ```

- **Open Drizzle Studio (Database GUI)**:

  ```bash
  pnpm db:studio
  ```

---

## 🔗 Related Documentation

- [Architecture & System Design](./architecture.md) - Learn about the decoupled extension registry, core `yt-dlp` engine, and streaming proxy.
- [Cookie Management & Rotation Guide](./cookie.md) - Learn how to configure platform burner cookies and Netscape cookie rotation.
