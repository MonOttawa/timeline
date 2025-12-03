# Code Review Notes

## Findings (ordered by severity)

- **Client-only title uniqueness (risk of collisions)** — `src/components/TimelineGenerator.jsx` (~360): uniqueness check is client-side and only blocks when a duplicate is seen at save time. Concurrent saves (other users/tabs) or direct API calls can still create duplicate titles. Add a server-side uniqueness rule (PocketBase) or a dedicated endpoint; keep the UI guard but don’t rely on it.
- **Dashboard backfill mutates history** — `src/components/Dashboard.jsx` (~80/200): `ensureTimestamps` calls `updateTimeline` for missing `updated` on every fetch. Because `updateTimeline` stamps `updated = now`, first load will rewrite historical timestamps, and repeated loads can drift them. Do not write during read; either skip backfill or run a one-time migration.
- **Warning/toast handling inconsistent** — Timeline uses a local warning toast; Learning uses inline banners; other flows still use alerts/generic errors. Extract a small reusable `<Toast>`/`<AlertBanner>` and standardize usage to avoid scattered patterns and missed error states.
- **Slug/title desync edge cases** — Timeline save recalculates slug only when empty; changing a title later leaves the old slug, which could break sharing expectations. Decide whether slugs should follow title changes (with collision handling) or remain stable, and implement consistently.
- **Verbose logging in production paths** — `TimelineGenerator` still contains multiple `console.log` calls in parsing/initial load. Guard them behind a debug flag or remove to reduce noise.
- **Data model lookups not fully escaped** — Title check now escapes quotes, but other filters rely on string interpolation. Ensure all filters escape quotes or use parameterized queries to avoid breakage on special characters.
- **AI generation/markdown sync risks** — Timeline regenerates markdown from events and parses markdown into events, but lacks validation for required markers (`---` separators, `*date*` format). Add schema validation or user feedback when parsing fails to avoid silent data loss.
- **Learning cache/review duplication handling still ad hoc** — Due-card dedupe and badge sync improved, but learning APIs still assume a single `flashcard_reviews` record per card. Consider server-side constraints or a canonical “card” collection to prevent drift.

## Suggestions (maintainability/modularity)

- Centralize notifications (toast/banner) and reuse across Timeline, Learning, Settings.
- Move read-time timestamp backfill to a one-off migration; keep fetches side-effect-free.
- Enforce uniqueness (title/slug) in PocketBase schema; keep client guard for UX.
- Define a helper for PocketBase filters (escape quotes, etc.) and use everywhere.
- Add validation when importing/parsing timelines (warn on missing separators/dates).
- Decide slug-change policy on title edits and document it.
