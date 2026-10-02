# HIMS Frontend — Hospital Information Management System

Production-ready, large-scale **React + Tailwind CSS (+ separate CSS files)**
frontend scaffold with **role-based access** (Super Admin, Admin, Doctor,
Reception, Pharmacy).

This has already been `npm install`-ed and `npm run build`-ed successfully
in the sandbox that generated it — the structure compiles cleanly out of
the box.

## 1. Setup

```bash
npm install
cp .env.example .env      # then edit VITE_API_BASE_URL to point at your backend
npm run dev                # start local dev server
npm run build               # production build -> dist/
```

## 2. How role-based login works

1. `src/pages/auth/Login.jsx` shows 5 role cards (Admin, Super Admin,
   Doctor, Reception, Pharmacy) — matching your reference screenshot.
2. User picks a role → a username/password form appears.
3. On submit, `authService.login({ role, username, password })` calls
   `POST /auth/login`. Your backend should validate the role against the
   account and return `{ token, user: { id, name, role, ... } }`.
4. The token + user are stored (`AuthContext`) and every subsequent API
   call automatically sends `Authorization: Bearer <token>` (see
   `src/api/axiosInstance.js`).
5. `src/config/sidebarConfig.js` is the **single source of truth** for
   both the sidebar menu and the router — each item declares
   `allowedRoles`. The sidebar only renders items the logged-in role can
   see, and `ProtectedRoute` blocks direct URL access to anything the
   role isn't allowed to open (redirects to `/unauthorized`).

To add a new module: add one entry to `sidebarConfig.js`, create the page
component in `src/pages/<module>/`, add its `<Route>` in
`src/routes/AppRoutes.jsx`, and (if it talks to an API) add a service in
`src/api/services/` using the `createCrudService` factory.

## 3. Folder structure

```
src/
  api/
    axiosInstance.js       # single axios instance, interceptors, error toasts
    endpoints.js            # every backend path, in one place
    services/
      createCrudService.js  # generic getAll/getById/create/update/remove factory
      authService.js
      opdService.js, ipdService.js, billingService.js, ...  # one per module
  auth/
    AuthContext.jsx         # login/logout/token state
    ProtectedRoute.jsx       # auth + role guard for routes
    roles.js                 # ROLES enum + role labels + login card list
  components/
    common/                  # Button, Input, Table, Loader, PageContainer, Icon
    layout/                  # Sidebar, Topbar, DashboardLayout
  config/
    sidebarConfig.js         # nav + role map (drives sidebar AND routes)
  hooks/
    useAuth.js, useRole.js
  pages/
    auth/Login.jsx
    dashboard/Dashboard.jsx
    registration/, opd/, ipd/, billing/, patients/, staff/, reports/,
    pharmacy/, laboratory/, radiology/, ward/, billingInvoices/,
    inventory/, medicalReports/, emergency/, followup/, bulkMessaging/
    misc/Unauthorized.jsx, NotFound.jsx
  routes/
    AppRoutes.jsx             # every route + its role guard
  styles/
    variables.css, global.css
  utils/
    constants.js, helpers.js
```

Every page is a `.jsx` + it reuses the shared `PageContainer` (with its own
`PageContainer.css`) for consistent headers/spacing — swap the placeholder
body for real tables/forms as each module gets built out.

## 4. Avoiding CORS / axios errors (important)

This is the #1 source of the errors you mentioned. Checklist:

- **Backend must explicitly allow your frontend's origin** — not `*` —
  when `withCredentials`/cookies are used. Example (Express + `cors`):
  ```js
  app.use(cors({
    origin: ["http://localhost:5173", "https://your-frontend.onrender.com"],
    credentials: true,
  }));
  ```
- If you use **Bearer tokens** (the default in this scaffold), keep
  `VITE_USE_COOKIE_AUTH=false` and `withCredentials: false` — you don't
  need cookies/credentials mode at all, which sidesteps most CORS pain.
- If you switch to **httpOnly cookie auth**, set
  `VITE_USE_COOKIE_AUTH=true` and make sure the backend's CORS `origin`
  is an exact URL (never `*`) and `credentials: true` is set on both
  sides.
- `src/api/axiosInstance.js` already distinguishes "no response at all"
  (network/CORS failure) from real API error responses, and shows a
  clear toast for each — so you'll immediately see which one you're
  hitting instead of a silent failure.

See `DEPLOYMENT.md` for Render-specific steps.
