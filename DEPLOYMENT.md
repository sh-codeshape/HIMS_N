# Deploying to Render

## Frontend (this project) as a Static Site

1. Push this project to a GitHub repo.
2. On Render: **New → Static Site** → connect the repo.
3. Build settings:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Environment variable (Render → your static site → Environment):
   - `VITE_API_BASE_URL` = `https://your-backend.onrender.com/api`
   - `VITE_USE_COOKIE_AUTH` = `false` (unless your backend uses cookie
     sessions)

   Vite bakes `VITE_*` env vars into the build at **build time**, not
   runtime — so if you change this value later, trigger a new deploy
   (Render → Manual Deploy) rather than just restarting the service.
5. Add a rewrite rule so client-side routing (React Router) doesn't 404
   on refresh: Render → Static Site → **Redirects/Rewrites** →
   `/* → /index.html` (Rewrite).

## Backend

Whatever framework you use, make sure:

- CORS `origin` is set to your **exact** Render static site URL (e.g.
  `https://hims-frontend.onrender.com`), not `*`, especially once you
  enable credentials/cookies.
- The backend's own `PORT` binds to `process.env.PORT` (Render assigns
  this dynamically — hardcoding a port is a common cause of "site
  works locally, fails on Render").
- If frontend and backend are on different Render services (different
  subdomains), that's a cross-origin request by definition — the CORS
  config above is what makes it work, not a proxy or rewrite.

## Quick checklist if you still see errors after deploying

| Symptom | Likely cause |
|---|---|
| "Network Error" / CORS error in browser console | Backend `origin` doesn't exactly match the deployed frontend URL |
| 401 immediately after login on the deployed site but not locally | Cookie auth (`SameSite`/`Secure`) not configured for cross-site — switch to Bearer token auth, or set `SameSite=None; Secure` on the cookie |
| Blank page / 404 on refresh of any route other than `/` | Missing the `/* → /index.html` rewrite rule (see step 5 above) |
| API calls go to `localhost` in production | `VITE_API_BASE_URL` not set in Render's environment, or the site wasn't rebuilt after setting it |
