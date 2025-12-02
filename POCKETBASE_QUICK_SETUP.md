# Quick PocketBase Setup Guide

PocketBase is already running at `http://127.0.0.1:8090`! 🎉

## Choose Your Setup Method

### Option 1: Automated Setup (Recommended) ⚡

1. **Create admin account** (if you haven't already):
   - Open http://127.0.0.1:8090/_/ in your browser
   - Create your admin account

2. **Run the automated setup script**:
   ```bash
   node setup-pocketbase-schema.js your-admin-email@example.com your-admin-password
   ```

This will automatically create all required collections with proper API rules.

### Option 2: Import JSON Schema 📥

1. **Create admin account** (if you haven't already):
   - Open http://127.0.0.1:8090/_/ in your browser
   - Create your admin account

2. **Import the schema**:
   - Go to Settings → Import collections
   - Upload `pocketbase-schema.json`
   - Click "Review" then "Confirm"

### Option 3: Manual Setup 🔧

Follow the detailed instructions in `POCKETBASE_SETUP.md`

## Collections That Will Be Created

1. **timelines** - Stores user timelines
   - Fields: user, title, content, style, slug, public, viewCount
   - API Rules: Users can only access their own timelines; public timelines are viewable by anyone

2. **flashcard_reviews** - Stores spaced repetition flashcard data
   - Fields: user, card_id, question, answer, ease_factor, interval, repetitions, next_review
   - API Rules: Users can only access their own flashcards

3. **learning_cache** - Caches AI-generated learning content
   - Fields: topic, mode, content
   - API Rules: Public read/write (for caching)

## Verify Setup

Run this to check if collections exist:
```bash
./check-pocketbase-setup.sh
```

## Start Development

Once setup is complete:
```bash
npm run dev
```

Your app will connect to the local PocketBase instance automatically!

## Important Notes
- Dev uses the Vite `/api` proxy; leave `VITE_POCKETBASE_URL` pointing to your PocketBase URL and keep the client base empty in dev.
- The `timelines` collection does **not** have `created`/`updated` fields; use `title` or add your own timestamp fields if you need sorting by date.
- Run PocketBase with `./start-pocketbase.sh` (automigrations disabled) to avoid stale migrations.
- AI timelines: the generator enforces the markdown format and injects a fallback if the model returns only a title, so saving won’t fail.
