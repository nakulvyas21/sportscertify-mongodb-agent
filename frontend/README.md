# Sportscertify Web — SEO-first social frontend (Angular SSR)

The server-rendered web app for the Sportscertify social network. Every route is
**rendered on the server at request time**, so crawlers receive complete HTML with
correct `<title>`, meta description, canonical, Open Graph/Twitter tags, and JSON-LD
structured data — the foundation of the World Cup 2026 organic-traffic strategy.

It consumes the read-only [`../backend`](../backend) API.

## Routes

| Route | Purpose | SSR / SEO |
| --- | --- | --- |
| `/feed` | World Cup 2026 post feed | `CollectionPage` JSON-LD |
| `/post/:slug` | Single insight + comments + metrics | `Article` JSON-LD |
| `/u/:handle` | Professional profile + verified credentials | `ProfilePage` JSON-LD |

## Local development

The backend must be running and seeded first (see [`../backend`](../backend)).

```bash
npm install
# Point at the local backend; NG_ALLOWED_HOSTS authorizes the SSR host (SSRF guard).
BACKEND_BASE_URL=http://localhost:8080 NG_ALLOWED_HOSTS=localhost npm run serve:ssr 2>/dev/null \
  || (npm run build && BACKEND_BASE_URL=http://localhost:8080 NG_ALLOWED_HOSTS=localhost node dist/frontend/server/server.mjs)
# → http://localhost:4000/feed
```

For pure client-side dev (no SSR), `npm start` runs `ng serve` on :4200, but the API
base URL defaults to `http://localhost:8080` (see `src/app/core/api.config.ts`).

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `BACKEND_BASE_URL` | server env | Absolute URL of the backend API for SSR fetches. Set in `app.config.server.ts` / Cloud Run. |
| `NG_ALLOWED_HOSTS` | server env | Comma-separated hosts the SSR server will render for (Angular SSRF guard). **Required** on Cloud Run — include the `*.run.app` host and public domains. |

Build-time allowed hosts are also listed in `angular.json → architect.build.options.security.allowedHosts`.

## Deploy (Cloud Run)

```bash
gcloud builds submit --config cloudbuild.yaml .
```

Edit `cloudbuild.yaml` first: set `BACKEND_BASE_URL` to the deployed API URL and add the
service's `*.run.app` host to `NG_ALLOWED_HOSTS`. Optionally front it with Firebase Hosting
(rewrite `**` → this Cloud Run service).
