# PocketBase Authentication Setup

This app uses PocketBase for authentication. Follow these steps to set it up:

## 1. Download PocketBase

1. Go to [pocketbase.io](https://pocketbase.io/docs/)
2. Download the latest version for your operating system
3. Extract the downloaded file

## 2. Start PocketBase

### On macOS/Linux:
```bash
./pocketbase serve
```

### On Windows:
```bash
pocketbase.exe serve
```

PocketBase will start on `http://127.0.0.1:8090`

## 3. Create Admin Account

1. Open your browser and go to `http://127.0.0.1:8090/_/`
2. Create an admin account (this is for the admin dashboard)
3. You'll be redirected to the admin dashboard

## 4. Configure Environment Variables

By default, the app connects to `http://127.0.0.1:8090`. If you want to use a different URL:

1. Create a `.env` file in the project root (copy from `.env.example`)
2. Set your PocketBase URL:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_DATA_PROVIDER=pocketbase
VITE_APP_URL=http://localhost:5173
```

## 5. Test Authentication

1. Start your dev server: `npm run dev`
2. Click "Sign In / Create Account"
3. Try creating a new account
4. Check the PocketBase admin dashboard → **Users** collection to see registered users
5. If you switch between different PocketBase URLs, **log out and back in** so the auth token matches the active instance (stale tokens cause 400 create errors).

## PocketBase Admin Dashboard

Access the admin dashboard at `http://127.0.0.1:8090/_/` to:
- View registered users
- Manage collections
- Configure auth settings
- View logs

## Service User (API)

Create a dedicated user for the Timeline API:
1. Open the PocketBase Admin UI
2. Go to **Users** and create `api@substantifique.com` (or any service email)
3. Use that email/password for `TIMELINE_SERVICE_EMAIL` and `TIMELINE_SERVICE_PASSWORD`

## Running in Production

For production, you'll want to:
1. Run PocketBase as a service
2. Use a reverse proxy (nginx, caddy)
3. Enable HTTPS
4. Update `VITE_POCKETBASE_URL` to your production URL

See [PocketBase deployment docs](https://pocketbase.io/docs/going-to-production/) for more details.

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Change the admin password from the default
- Consider enabling 2FA for admin accounts in production

## 6. Create Timelines Collection

To enable the "Save" functionality, you must create a collection for timelines:

1. Go to the PocketBase Admin Dashboard (`http://127.0.0.1:8090/_/`)
2. Click **"New Collection"**
3. Name: `timelines`
4. Add the following fields:
   - `user`: **Relation** (Single) -> `users` collection (Required)
   - `title`: **Text**
   - `content`: **Editor** (IMPORTANT: Use Editor, not Text, to avoid 5000 character limit)
   - `style`: **Text**
   - `slug`: **Text**
   - `public`: **Bool**
   - `viewCount`: **Number** (min 0)
5. **API Rules**:
   - List/Search: `@request.auth.id != "" && user = @request.auth.id`
   - View: `@request.auth.id != "" && user = @request.auth.id || public = true`
   - Create: `@request.auth.id != ""`
   - Update: `@request.auth.id != "" && user = @request.auth.id`
   - Delete: `@request.auth.id != "" && user = @request.auth.id`

**Note on sorting:** the schema does not include `created`/`updated` fields. Use sortable fields that exist (e.g., `title`) or add your own timestamp fields if you need sort-by-date.

## AI Timeline Generation
- The AI modal enforces the required markdown format; if the model omits events, a fallback timeline is injected so saves don’t fail.
- To add providers/models, use the header ⚙️ Settings modal; env defaults live in `.env`.
