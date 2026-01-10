# Production Checklist

## Frontend (Docker + Nginx)
- Serve the site over HTTPS (terminate TLS at your edge proxy/load balancer).
- Consider enabling HSTS at the edge once HTTPS is stable (`Strict-Transport-Security`).
- Confirm embedding behavior:
  - `/` is not frameable (reduces clickjacking risk for auth-only views).
  - `/timeline/*` and `/embed/*` are frameable for share/embed use-cases.
- Verify your CSP works with your deployment:
  - `connect-src` allows `https:` and `wss:` (PocketBase realtime + AI providers).
  - If you add any non-HTTPS endpoints, update CSP and prefer migrating to HTTPS instead.
- The provided `docker-compose.yml` runs Nginx + PocketBase together:
  - Frontend: port 80
  - PocketBase: exposed on `8090` (admin UI + API)
  - `/api` is also proxied through Nginx for same-origin calls.
  - If you change PocketBase URLs, force a re-login to avoid stale auth tokens.

## Environment Variables
- `VITE_POCKETBASE_URL`:
  - Set to your PocketBase HTTPS URL, or
  - Leave unset only if you reverse-proxy PocketBase under the same origin at `/api`.
- `VITE_APP_URL`: set to your public site origin for correct share/embed links.

## PocketBase Hardening
- Enforce access rules (server-side) for all collections:
  - `timelines`: owner-only for private records; allow public read only when `public=true`.
  - `flashcard_reviews` / `learning_cache`: owner-only.
- Add server-side uniqueness constraints where needed:
  - Unique `slug` (recommended).
  - Optionally: unique `(user, title)` if you want to enforce title uniqueness.
- Lock down admin access:
  - Do not expose the PocketBase admin UI publicly without additional protection.
  - Restrict CORS origins to your frontend domain(s) if you rely on cross-origin calls.
- Back up `pb_data` regularly and test restores.

## AI Provider Keys
- Do not ship shared provider API keys in the browser (any `VITE_` value is client-exposed).
- Prefer BYOK (user enters their own key) or a backend proxy that holds secrets server-side.

