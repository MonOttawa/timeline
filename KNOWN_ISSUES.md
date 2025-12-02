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
