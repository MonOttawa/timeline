# Timeline (React + Vite)

PocketBase-backed timelines and learning content. Dev uses the Vite `/api` proxy to reach PocketBase; prod uses `VITE_POCKETBASE_URL`.

## Quick Start (local)
1) Copy `.env.example` → `.env` and ensure each var is on its own line:
   - `VITE_POCKETBASE_URL=http://127.0.0.1:8090`
   - `VITE_DATA_PROVIDER=pocketbase`
2) Start PocketBase: `./start-pocketbase.sh` (runs PB on 8090, automigrate off).
3) Start dev server: `npm run dev -- --host 0.0.0.0 --port 5173`
   - UI at `http://localhost:5173`
   - API proxied via `/api` → PocketBase
4) Login with `testuser@example.com` / `password1234!` (seed user) or create a new one.
5) If you recently pointed the app at a different PocketBase instance, **log out and back in** (stale auth tokens cause 400 create errors).

## PocketBase schema essentials
- Collections: `timelines`, `flashcard_reviews`, `learning_cache`
- Timeline fields: `user (relation _pb_users_auth_)`, `title (text)`, `content (editor)`, `style (text)`, `slug (text)`, `public (bool)`, `viewCount (number)`
- API rules for `timelines`: `list/view/update/delete` require auth and ownership; `view` also allows `public=true`; `create` requires auth.
- Do **not** sort by `created`/`updated`—those fields are not defined in this schema. Use `title` or add explicit sort fields if needed.

## Environment Variables

- `VITE_POCKETBASE_URL` (required unless reverse-proxying `/api`): PocketBase base URL (no trailing `/api`), e.g. `https://substantifiquedb.rosehilltech.com`.
 - `VITE_DATA_PROVIDER` (default `pocketbase`): Switch provider when Supabase is added.
- `VITE_APP_URL` (recommended): Public site URL for share/embed links, e.g. `https://timeline.example.com`.
- `VITE_COMMIT_HASH` (optional): Short git SHA to display in the footer build tag.

For a production deployment checklist (CSP/headers, PocketBase rules, key handling), see `PRODUCTION.md`.

### AI Provider Configuration (Optional)

The application supports multiple AI providers. Users can configure these via the Settings modal in the UI (BYOK, stored locally in the browser).

You can also set provider keys via `VITE_...` env vars for local development, but note that **any `VITE_` value is embedded into the client bundle and is not secret**. To avoid accidental key exposure, the app ignores these env keys in production builds.

- `VITE_OPENROUTER_API_KEY`: OpenRouter API key
- `VITE_GROQ_API_KEY`: Groq API key
- `VITE_CEREBRAS_API_KEY`: Cerebras API key
- `VITE_OPENAI_API_KEY`: OpenAI API key
- `VITE_ANTHROPIC_API_KEY`: Anthropic API key
- `VITE_GEMINI_API_KEY`: Google Gemini API key
- `VITE_ZAI_API_KEY`: Z.AI (Zhipu GLM) API key

If you need a single shared key for a public deployment, add a backend proxy that holds the secret server-side and call that proxy from the UI.

### Architecture & Backend Migration

The application has been refactored to fully decouple the UI from the database. All data access logic is isolated in `src/lib/api/`.

For detailed information on the architecture and how to migrate to Supabase, please see [ARCHITECTURE.md](./ARCHITECTURE.md).

#### Detailed migration plan (PocketBase → Supabase)
1) **Schema & policies**
   - Create `timelines` table with columns: `id (uuid)`, `user (uuid ref to auth.users)`, `title text`, `content text`, `style text`, `slug text`, `public boolean`, `viewCount int`, `created_at`, `updated_at`.
   - Add unique index on `slug` (or enforce via policy); allow nullable `slug` if needed but prefer unique.
   - Configure RLS: owner can read/write/delete their rows; public read only when `public=true`.
2) **Supabase client setup**
   - Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` envs.
   - Add `src/lib/api/client.js` logic to choose Supabase client when configured; export `getDataClient` returning Supabase instance.
3) **Auth layer (`src/lib/api/auth.js`)**
   - Replace PocketBase calls with Supabase auth methods: `signInWithPassword`, `signUpWithPassword`, `onAuthChange` using Supabase auth session listener, `clearSession` using `supabase.auth.signOut`.
   - Update `AuthProvider` to use Supabase session/user shape (map to `user` object expected by UI).
4) **Timelines API (`src/lib/api/timelines.js`)**
   - Rewrite `listTimelinesByUser`, `deleteTimeline`, `getPublicTimeline`, `incrementViewCount` using Supabase queries:
     - `listTimelinesByUser`: `supabase.from('timelines').select('*').eq('user', userId).order('updated_at', { ascending: false })`.
     - `deleteTimeline`: `supabase.from('timelines').delete().eq('id', timelineId)`.
     - `getPublicTimeline`: first by `slug` and `public=true`; fallback by `id` with `public=true`.
     - `incrementViewCount`: RPC or update with `viewCount + 1`.
5) **Storage considerations**
   - If you store files/assets per timeline, add Supabase Storage buckets or encode content inline as today. Current app stores markdown content directly; no file storage changes needed unless you add uploads.
6) **Env & build**
   - Ensure builds include Supabase envs; optionally fail build if neither PocketBase nor Supabase is configured.
7) **Testing**
   - Manual smoke: auth (sign up/sign in/sign out), dashboard list, create/edit/save timeline, toggle public/share, public view by slug/`rid`, style override, embed mode.
   - Validate RLS by hitting public URLs while signed out.
8) **Cutover**
   - Deploy Supabase-backed API layer.
   - Migrate existing PocketBase data to Supabase (export/import), preserving slugs and `public` flags.
   - Update `VITE_POCKETBASE_URL` references out; ensure only Supabase envs remain in prod.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



### [View Roadmap](./ROADMAP.md)

### Deploying to Dokploy (Beginner's Guide)

This guide assumes you have a Dokploy instance running and access to this GitHub repository.

#### Prerequisites
1.  **Dokploy Account**: Access to your Dokploy dashboard.
2.  **GitHub Account**: Your GitHub account connected to Dokploy.
3.  **PocketBase URL**: The URL of your live PocketBase instance (e.g., `https://substantifiquedb.rosehilltech.com`).

#### Step 1: Create Application
1.  Go to your Dokploy Dashboard.
2.  Click on your Project.
3.  Click **"Create Application"**.
4.  Fill in the details:
    *   **Name**: `substantifique` (or any name you prefer)
    *   **Description**: `Substantifique - Markdown Timelines + AI Learning`

#### Step 2: Configure Source (General Tab)
Once the application is created, you will see the configuration tabs. Stay on the **General** tab.

*   **Provider**: Select **GitHub**.
*   **Github Account**: Select your connected GitHub account (e.g., `Dokploy` or your username).
*   **Repository**: Select `substantifique` (or `MonOttawa/substantifique`).
*   **Branch**: Select `main`.
*   **Build Path**: Leave as `/` (this is the root directory of your project).
*   **Trigger Type**: Select **On Push** (this ensures the app redeploys automatically when you push code changes).

Click **"Save"** if there is a save button, or proceed to the next tab.

#### Step 3: Configure Build (Environment Tab)
Switch to the **Environment** tab.

1.  **Build Type**: Select **Dockerfile**.
    *   **Docker File**: Enter `./Dockerfile`.
    *   **Docker Context Path**: Leave empty (defaults to `.`).
    *   **Docker Build Stage**: Leave empty (defaults to the last stage).
    *   *Note: The project includes a `Dockerfile` that handles building the React app and serving it with Nginx.*

2.  **Environment Variables**:
    You will see a text area to enter variables. Enter them in `KEY=VALUE` format.
    *   Enter: `VITE_POCKETBASE_URL=https://substantifiquedb.rosehilltech.com`
    *   Click **"Save"**.

#### Step 4: Configure Domain (Domains Tab)
Switch to the **Domains** tab to make your site accessible via a URL.

1.  Click **"Add Domain"**.
2.  Fill in the fields exactly as follows:
    *   **Host**: Enter your domain (e.g., `substantifique.rosehilltech.com`).
    *   **Path**: Enter `/`.
    *   **Internal Path**: Enter `/` (defaults to `/`).
    *   **Container Port**: Enter `80`.
        *   *Important: This must be `80` because the `Dockerfile` exposes port 80.*
    *   **HTTPS**: Toggle **On** (this automatically provisions a free SSL Certificate).
3.  Click **"Create"**.

#### Step 5: Deploy
1.  Go back to the top of the page or the main dashboard for this app.
2.  Click the **"Deploy"** button.
3.  Wait for the logs to show "Deployment Successful".

Your app should now be live at your configured domain!
