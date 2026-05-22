# Glimpse Frontend

Glimpse is a React-based social content experience for browsing moments, managing a profile, saving posts, and handling account flows such as signup, verification, and password reset.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Framework | React 19 |
| Build tool | Vite |
| Routing | React Router DOM |
| HTTP client | Axios |
| Realtime client | Socket.IO client |
| Styling | Tailwind CSS 4 + custom CSS |
| Linting | ESLint |

## Features

- Auth flows for signup, email verification, login, forgot password, and reset password.
- Protected routes for the main feed, profile, settings, and profile setup.
- User profile state managed centrally through context.
- Feed rendering with live socket updates for new posts, likes, and deletions.
- Profile setup and settings screens for avatar upload, preferences, privacy, and notifications.
- Backend API integration with bearer-token authentication.

## Folder Structure

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | Route definitions and auth/profile guards |
| `src/main.jsx` | App bootstrap and context provider wiring |
| `src/api/axios.js` | Axios instance, base URL, token injection, 401 handling |
| `src/services/apiService.js` | Domain API wrappers for auth, posts, comments, users, settings, discovery |
| `src/context/UserContext.jsx` | User/profile/session state and refresh logic |
| `src/socket.js` | Socket.IO client connection |
| `src/pages/` | Page-level screens |
| `src/components/` | Reusable UI components |
| `src/data/` | Local mock data used by the UI |
| `src/utils/` | Shared client-side helpers |

## Installation

1. Install dependencies:

	```bash
	npm install
	```

2. Create a `.env` file in `Frontend/` with the required runtime values.

## Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | Local dev: `http://localhost:5000`; production: `https://glimpse-backend-tin1.onrender.com` | Base URL for the backend API and socket connection |

Local development can use the checked-in `.env.example` value. In Vercel, set `VITE_API_URL=https://glimpse-backend-tin1.onrender.com` so the production bundle points at Render.

## Run Locally

Start the development server:

```bash
npm run dev
```

Open the app at the Vite URL shown in the terminal, typically `http://localhost:5173`.

## Build And Deploy

Build the production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

For deployment, publish the `dist/` output to Vercel or another static host and point `VITE_API_URL` at the deployed backend service. The frontend expects the backend to allow the deployed origin through CORS.

## API Integration

- `src/api/axios.js` creates the shared Axios client and automatically attaches `Authorization: Bearer <token>` from `localStorage`.
- A `401` response clears the token and emits a logout event so the UI can reset auth state.
- `src/services/apiService.js` wraps the backend endpoints used by the pages and forms.
- `src/context/UserContext.jsx` loads `/api/user/me` on startup, stores the current user/profile payload, and exposes refresh/update helpers.
- `src/socket.js` opens a Socket.IO connection to the same backend base URL for realtime feed updates.

## Contributor Notes

- Keep the frontend base URL aligned with backend CORS configuration and the deployed API origin.
- All authenticated requests rely on the token stored in `localStorage`; do not change the auth flow without updating the Axios interceptor and `UserContext`.
- File uploads are sent as `FormData`, so any API changes on the backend must preserve the expected field names.
- Run `npm run lint` before submitting changes.
- The app currently uses JavaScript, not TypeScript, and the route guards assume the backend returns `profileCompleted` and `isVerified` flags.

## PWA Update Mechanism (simple explanation)

- **How updates are triggered:** The service worker checks for new files when the browser navigates to the app or when the service worker script itself changes. During a new deployment the server serves new assets (with new filenames/hashes), the browser downloads them and installs the updated service worker.
- **Why users may not see updates immediately:** A currently active service worker controls open pages until it is replaced. Even if a new service worker is installed, it typically waits to activate until existing tabs are closed, so users may continue seeing the old version until reload or tab close.
- **How caching affects updates:** The service worker caches static assets (HTML, JS, CSS, images). If the worker serves cached files, the UI shows the cached version. New assets are fetched when the worker updates its cache during the install step.
- **How to force an update (conceptual):** Use `skipWaiting()` in the new service worker to activate immediately and `clients.claim()` to take control of pages. From the app, you can prompt users to reload when an update is available; calling `window.location.reload()` after the new worker activates ensures they get the newest files.

If you want, I can add a small status banner that notifies users when a new version is available and offers a refresh button.
