# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



### Deploying to Dokploy (Beginner's Guide)

This guide assumes you have a Dokploy instance running and access to this GitHub repository.

#### Prerequisites
1.  **Dokploy Account**: Access to your Dokploy dashboard.
2.  **GitHub Account**: Your GitHub account connected to Dokploy.
3.  **PocketBase URL**: The URL of your live PocketBase instance (e.g., `https://timelinedb.rosehilltech.com`).

#### Step 1: Create Application
1.  Go to your Dokploy Dashboard.
2.  Click on your Project.
3.  Click **"Create Application"**.
4.  Fill in the details:
    *   **Name**: `timeline` (or any name you prefer)
    *   **Description**: `Markdown Timeline Frontend`

#### Step 2: Configure Source (General Tab)
Once the application is created, you will see the configuration tabs. Stay on the **General** tab.

*   **Provider**: Select **Git**.
*   **Github Account**: Select your connected GitHub account (e.g., `Dokploy` or your username).
*   **Repository**: Select `timeline` (or `MonOttawa/timeline`).
*   **Branch**: Select `main`.
*   **Build Path**: Leave as `/` (this is the root directory of your project).
*   **Trigger Type**: Select **On Push** (this ensures the app redeploys automatically when you push code changes).

Click **"Save"** if there is a save button, or proceed to the next tab.

#### Step 3: Configure Build (Environment Tab)
Switch to the **Environment** tab.

1.  **Build Type**: Select **Dockerfile**.
    *   *Note: The project includes a `Dockerfile` that handles building the React app and serving it with Nginx.*

2.  **Environment Variables**:
    You need to tell the app where your database lives.
    *   Key: `VITE_POCKETBASE_URL`
    *   Value: `https://timelinedb.rosehilltech.com`
    *   Click **"Add"** or **"Save"**.

#### Step 4: Configure Domain (Network/Domains Tab)
Switch to the **Domains** (or Network) tab to make your site accessible via a URL.

1.  Click **"Add Domain"**.
2.  Fill in the fields:
    *   **Domain Name**: Enter your desired domain (e.g., `timeline.rosehilltech.com`).
    *   **Path**: Enter `/`.
    *   **Port**: Enter `80`.
        *   *Why 80? The `Dockerfile` is configured to serve the app on port 80 internally.*
    *   **Certificate**: Select **Let's Encrypt** (this gives you free HTTPS/SSL).
3.  Click **"Create"** or **"Save"**.

#### Step 5: Deploy
1.  Go back to the top of the page or the main dashboard for this app.
2.  Click the **"Deploy"** button.
3.  Wait for the logs to show "Deployment Successful".

Your app should now be live at your configured domain!
