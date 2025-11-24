# Repository Guidelines

## Project Structure & Module Organization
- `src/main.jsx` seeds the React + Vite app; `App.jsx` coordinates auth, landing, generator, and legal views.
- UI modules live in `src/components/`, shared state in `src/contexts/AuthContext.jsx`, helpers in `src/lib/`, seed content in `src/data/` + `src/poemlearning_reference/`, and assets/styles under `src/assets/`, `App.css`, and `index.css` (static files live in `public/`).
- Deployment artifacts (`Dockerfile`, `nginx.conf`) sit at the repo root; `dist/` stores build output consumed by Dokploy.

## Build, Test, and Development Commands
- `npm install` – install React 19, Vite, Tailwind 4, and the PocketBase client.
- `npm run dev` – start the HMR dev server on `http://localhost:5173` for UI/auth iteration.
- `npm run build` – emit optimized assets into `dist/` for the Docker + Nginx image.
- `npm run preview` – serve the production bundle locally to validate routing and static assets.
- `npm run lint` – apply the ESLint config (hooks, React Refresh, globals).

## Coding Style & Naming Conventions
- Stick to functional components with hooks; name files/components in PascalCase (`Header.jsx`), contexts/hooks camelCase.
- Use Tailwind utility classes for layout; reserve custom CSS for app-wide tweaks in `App.css`.
- Keep 2-space indentation, single-quoted strings, and descriptive prop names.
- Run `npm run lint` prior to committing and prefer code fixes over disabling rules.

## Testing Guidelines
- No automated suite yet—exercise flows manually via `npm run dev`, covering auth, AI generation, templates, exports, and PocketBase sync.
- Log PocketBase/OpenRouter responses in `TimelineGenerator.jsx` when debugging; clean up diagnostics before pushing.
- Use linting as the minimum gate; if you add complex helpers in `src/lib/`, stand up short-lived unit harnesses.

## Commit & Pull Request Guidelines
- Follow the existing format (`Feat:`, `Fix:`, `Update:` + Title Case verb). Add scopes when touching a narrow surface (`Feat(auth): …`).
- PRs must state intent, verification steps (`npm run build`, manual scenarios), and link issues or deployment tickets.
- Include screenshots or short clips for UI changes, ideally captured from `npm run preview`.
- Keep PRs focused; split auth, template, and infrastructure work when changes grow beyond ~300 lines.

## PocketBase & Environment
- Define `VITE_POCKETBASE_URL` in a local `.env` or Dokploy secrets (see `POCKETBASE_SETUP.md` for bootstrap guidance).
- Never commit API tokens or admin credentials; rely on the Vite `VITE_` prefix so values stay client-readable yet controlled.
- When testing remote databases, reset mock entries in `src/data/` after experiments to avoid leaking sample content.
