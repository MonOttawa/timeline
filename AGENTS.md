# Repository Guidelines & Agent Instructions

## 1. Build, Lint, and Test Commands

### core-commands
- **Install Dependencies**: `npm install`
  - Installs React 19, Vite, Tailwind 4, PocketBase client, and other dependencies.
- **Development Server**: `npm run dev`
  - Starts Vite HMR server on `http://localhost:5173`.
  - Use this for rapid iteration on UI and logic.
- **Build for Production**: `npm run build`
  - Generates optimized assets in `dist/`.
  - Used for Docker + Nginx deployment.
- **Preview Production Build**: `npm run preview`
  - Serves the `dist/` folder locally to verify routing and assets before deployment.
- **Linting**: `npm run lint`
  - Runs ESLint with the flat config (`eslint.config.js`).
  - Checks for unused variables, React hooks rules, and global ignore patterns.
  - **Always run this before committing changes.**

### testing-strategy
- **Automated Tests**: There is currently **no automated test suite** (Jest/Vitest).
- **Manual Verification**:
  - You must manually exercise user flows via `npm run dev`.
  - Key flows to check:
    1. **Authentication**: Sign up, login, logout.
    2. **Timeline Generation**: Create, edit, save, load, and export (PNG/SVG/JPG).
    3. **AI Generation**: Verify AI prompts and markdown parsing.
    4. **Learning Assistant**: Flashcards, quizzes, and SRS logic.
    5. **PocketBase Sync**: ensure data persists (check network tab/console logs).
- **Debugging**:
  - Log PocketBase/AI responses in the console during development.
  - Remove debug logs before pushing to production.

---

## 2. Code Style Guidelines

### formatting-and-structure
- **Indentation**: Prefer **2 spaces**. (Note: Legacy files might use 4; follow local file consistency if editing, but new files should use 2).
- **Quotes**: Single quotes `'` preferred for JS/JSX strings, double quotes `"` for HTML attributes if needed, though consistency is key.
- **Component Structure**:
  - Use **Functional Components** with Hooks.
  - Avoid Class components unless using Error Boundaries.
  - Place hooks at the top of the component.
  - Group related state and effects.
- **File Organization**:
  - `src/components/`: UI components (PascalCase, e.g., `Header.jsx`).
  - `src/contexts/`: React contexts (camelCase, e.g., `AuthContext.js`).
  - `src/hooks/`: Custom hooks (camelCase, e.g., `useAuth.js`).
  - `src/lib/`: Logic helpers and API clients.
  - `src/data/`: Static data and seed content.

### naming-conventions
- **Files**:
  - React Components: `PascalCase.jsx` (e.g., `TimelineGenerator.jsx`).
  - Logic/Helpers: `camelCase.js` (e.g., `pocketbaseError.js`).
- **Variables & Functions**:
  - `camelCase` for variables and functions.
  - `PascalCase` for React components and Contexts.
  - `UPPER_CASE` for constants (e.g., `DEFAULT_TIMEOUT`).
- **Props**:
  - Descriptive names (e.g., `onNavigateHome`, `showDashboard`).
  - Boolean props should start with `is`, `has`, or `show` (e.g., `isLoading`, `showModal`).

### styling-system
- **Framework**: Tailwind CSS 4.
- **Approach**: Utility-first.
- **Design Language**: "Neo-Brutalist".
  - **Key traits**: Hard borders (`border-2 border-black`), hard shadows (`shadow-[4px_4px_0px_#000]`), bold colors (Yellow-300, Purple-400), no border-radius smoothing.
  - **Constraints**:
    - Never use solid black backgrounds for buttons (accessibility/style choice).
    - Use specific colors defined in the theme (e.g., `bg-yellow-300` for accents).
- **Icons**: Use **Lucide React** exclusively. Import individual icons (e.g., `import { Sun, Moon } from 'lucide-react'`).

### error-handling
- **PocketBase**:
  - Wrap async calls in `try/catch`.
  - Use helper functions in `src/lib/pocketbaseError.js` to format messages.
  - Display user-friendly errors, not raw stack traces.
- **UI Boundaries**:
  - Major views (Dashboard, Editor) are wrapped in `ErrorBoundary`.
  - Ensure fallback UIs match the brutalist aesthetic.

### imports-and-deps
- **Order**:
  1. React + Hooks
  2. Third-party libraries (`lucide-react`, `marked`, `pocketbase`)
  3. Internal Components
  4. Contexts/Hooks
  5. Helpers/Lib
  6. Assets/CSS
- **Restrictions**:
  - Do not introduce new heavy dependencies without user approval.
  - Use `fetch` for simple requests if PocketBase SDK is not applicable.

---

## 3. Project Architecture & Environment

### key-files
- `src/main.jsx`: App entry point.
- `src/App.jsx`: Main routing and layout coordinator.
- `src/lib/api/`: API wrapper functions (separation of concerns).
- `pocketbase-schema.json`: Database schema definition.

### environment-variables
- `VITE_POCKETBASE_URL`: URL of the PocketBase instance.
- **Security**:
  - Secrets (API keys) should generally be backend-managed or carefully exposed via `VITE_` if client-side is absolutely necessary (e.g. OpenRouter direct access in demo mode).
  - Never commit `.env` files containing real secrets.

### deployment
- **Docker**: Root `Dockerfile` builds the app and serves via Nginx.
- **Nginx**: `nginx.conf` handles routing for SPA (rewrites to `index.html`).
- **Output**: Build artifacts go to `dist/`.

---

## 4. Workflow for Agents

1. **Analysis**:
   - Start by listing files or searching for relevant components.
   - Read `package.json` to verify dependencies.
2. **Implementation**:
   - Follow the **Neo-Brutalist** style for any new UI.
   - Use `lucide-react` for icons.
   - Ensure `npm run lint` passes after changes.
3. **Verification**:
   - Since there are no tests, clearly state how the user should manually verify the change.
   - Example: "Go to Dashboard, click 'Create New', and verify the editor loads."

