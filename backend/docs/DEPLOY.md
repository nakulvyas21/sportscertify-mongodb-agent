# Deploying the Social API to Cloud Run

The API deploys as its own Cloud Run service via Cloud Build.

## Prerequisites

- `gcloud` CLI authenticated against your target GCP project.
- A MongoDB Atlas cluster reachable from Cloud Run
  (allow `0.0.0.0/0` on the Atlas IP access list for the demo, or use the Cloud
  Run egress IP).
- A Voyage AI API key.

## 1. Store secrets in Secret Manager (never in the image)

```bash
gcloud secrets create MDB_MCP_CONNECTION_STRING --replication-policy=automatic
printf '%s' 'mongodb+srv://USER:PASS@CLUSTER.mongodb.net/?retryWrites=true&w=majority' \
  | gcloud secrets versions add MDB_MCP_CONNECTION_STRING --data-file=-

gcloud secrets create VOYAGE_API_KEY --replication-policy=automatic
printf '%s' 'pa-xxxxxxxx' | gcloud secrets versions add VOYAGE_API_KEY --data-file=-
```

Grant the Cloud Run runtime service account `roles/secretmanager.secretAccessor`.

## 2. Deploy

```bash
gcloud builds submit --config cloudbuild.yaml .
```

This builds `Dockerfile`, pushes the image, and deploys the
`sportscertify-social-api` Cloud Run service with `MDB_MCP_READ_ONLY=true` and the
secrets wired in. The service exposes `/health`, `/feed`, `/search`, `/professionals`.

## 3. Verify

```bash
SERVICE_URL=$(gcloud run services describe sportscertify-social-api \
  --region europe-west3 --format='value(status.url)')
curl "$SERVICE_URL/health"
curl "$SERVICE_URL/search?q=altitude%20endurance"
```

## 4. Wire the frontend to it

Set the Angular SSR frontend's `BACKEND_BASE_URL` (in its `cloudbuild.yaml`) to
this service's URL.

## Notes

- The MCP server (`@mongodb-js/mongodb-mcp-server`) is **not** part of this Cloud
  Run service — it's launched separately (locally via `npm run mcp`, or as its own
  small Cloud Run service) for the Gemini agent. The API service talks to Atlas
  directly via the driver, read paths only.
- One-time data setup (`npm run seed`, `npm run create-index`) is run **locally**
  against the temporary cluster, not from Cloud Run.
