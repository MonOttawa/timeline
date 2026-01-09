# Known Issues

## Remote PocketBase Server Down (CRITICAL)

**Status**: BLOCKED - Requires manual intervention

**Symptom**: 
- Dashboard shows "Unable to load timelines. Status: 521"
- Console shows HTTP 521 errors from `substantifiquedb.rosehilltech.com`

**Root Cause**: 
The remote PocketBase deployment is not responding. Cloudflare returns HTTP 521 (Web Server Is Down).

**Temporary Workaround**:
1. Start local PocketBase:
   ```bash
   ./pocketbase serve
   ```
2. Update `.env`:
   ```
   VITE_POCKETBASE_URL=http://127.0.0.1:8090
   ```
3. Restart dev server

**Permanent Fix**:
1. Access Dokploy dashboard: https://dok.rosehilltech.com
2. Navigate to PocketBase application
3. Check status and logs
4. Restart the deployment
5. Verify it's accessible at https://substantifiquedb.rosehilltech.com

## Recent Fixes (Completed)

### 1. CORS Proxy Implementation ✅
- **Fixed**: Added Vite proxy configuration to handle CORS in development
- **Files**: `vite.config.js`, `src/lib/pocketbase.js`

### 2. Quote Escaping in Titles ✅
- **Fixed**: Special characters in learning session titles now handled correctly
- **File**: `src/lib/api/timelines.js`

### 3. Pagination Response Format ✅
- **Fixed**: Components now correctly handle paginated API responses
- **Files**: `src/components/TimelineGenerator.jsx`, `src/components/Dashboard.jsx`, `src/components/LearningAssistant.jsx`

## Next Steps

1. Restart remote PocketBase deployment
2. Test dashboard connection
3. Verify save/load functionality
4. Continue with planned features from ROADMAP.md

## Follow-up Tasks
- Enforce unique timeline titles server-side to avoid race conditions; current check is client-only.
- Avoid overwriting historical `updated` dates during dashboard backfill; prefer a guarded migration instead of writing on fetch.
- Standardize warning/toast UI across Timeline/Learning/Settings (extract reusable component).
- Fix the duplicate-title guard for names containing quotes—`TimelineGenerator` pre-escapes titles before calling `findTimelineByTitle`, so quoted titles skip the collision check.
- Escape PocketBase filters in learning helpers (cache lookups, due card queries) and avoid unbounded `getFullList` calls so topics with quotes or large datasets don’t break requests or hang the UI.
- Move public view counts to an atomic server-side increment; current read-then-write per view can double count and lose increments under load.

## PocketBase Local Setup
- **Issue**: Automated schema import fails for `relation` fields.
- **Error**: `validation_required: Cannot be blank.` for `collectionId` property, even when provided in `options`.
- **Context**: Occurs when using the PocketBase v0.23+ API to create collections programmatically via `fetch` or SDK.
- **Workaround**: 
    1. Create the `timelines` and `flashcard_reviews` collections manually in the Admin UI.
    2. Or, create them without the `user` relation field first, then add the relation field manually.
- **Status**: Tracked. Automation script `import-schema.js` is paused.
