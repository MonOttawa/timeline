# Timeline API (MVP)

A minimal machine-to-machine API for generating, persisting, and rendering timelines. It is designed for automation tools like Windmill.

---

## Endpoint

`POST /api/v1/timelines/compose`

### Headers
- `Content-Type: application/json`
- `x-api-key: <TIMELINE_API_KEY>`

### Request Body
Provide either `notes` (AI generation) or `markdown` (preformatted).

```json
{
  "title": "Startup Journey",
  "notes": "Raw notes or source text",
  "style": "bauhaus-mono"
}
```

```json
{
  "title": "Startup Journey",
  "markdown": "# Startup Journey\n\n*Month 1*\n...",
  "style": "bauhaus-mono"
}
```

### Response
```json
{
  "timelineId": "pb_record_id",
  "markdown": "# ...",
  "imageUrl": "https://garage.mondylab.com/timelines/<id>.png"
}
```

---

## Behavior
- Always persists the timeline in PocketBase (service user).
- Renders a PNG using the `/render` route and headless Chromium.
- Uploads the PNG to S3-compatible storage and returns a public URL.
- Defaults to `bauhaus-mono` if no style is provided.

---

## Environment Variables (API service)

Required:
- `TIMELINE_API_KEY` – API key required by clients
- `TIMELINE_SERVICE_EMAIL` / `TIMELINE_SERVICE_PASSWORD` – PocketBase service user
- `TIMELINE_AI_API_KEY` – AI provider key (OpenAI-compatible)
- `TIMELINE_AI_MODEL` – AI model identifier
- `TIMELINE_S3_ENDPOINT` – S3-compatible endpoint (e.g., `https://garage.mondylab.com`)
- `TIMELINE_S3_BUCKET`
- `TIMELINE_S3_ACCESS_KEY`
- `TIMELINE_S3_SECRET_KEY`
- `TIMELINE_S3_PUBLIC_URL` – public base URL for returned image links

Optional:
- `TIMELINE_AI_BASE_URL` – defaults to `https://openrouter.ai/api/v1`
- `TIMELINE_S3_REGION` – defaults to `us-east-1`
- `TIMELINE_S3_FORCE_PATH_STYLE` – `true` for MinIO-style endpoints

---

## Service User Setup (PocketBase)

Create a dedicated PocketBase user for the API:
1. Open `http://127.0.0.1:8090/_/`
2. Go to **Users** and create a new user (e.g., `api@substantifique.com`)
3. Use this email/password as `TIMELINE_SERVICE_EMAIL/PASSWORD`

---

## Local Development

```bash
# start PB + web + API
docker compose up --build

# test API
curl -X POST "http://localhost/api/v1/timelines/compose" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $TIMELINE_API_KEY" \
  -d '{"title":"Startup Journey","notes":"...","style":"bauhaus-mono"}'
```

---

## Security Notes
- Keep `TIMELINE_API_KEY` private and rotate it as needed.
- Use a dedicated service user with least privilege.
- If you change PocketBase URLs, re-login to avoid stale tokens.

---

## Render Route

The API uses the render-only route:

`/render?md=<base64>&style=bauhaus-mono&title=...`

This route is not intended for users, only for headless rendering.
