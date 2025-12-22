## Deployment Plan (Shared Hosting)

### Access & Repo
- Enable SSH for your user in cPanel (support if needed).
- Connect: `ssh -i <key> user@host -p <port>`.
- Workdir: `/home/gotrippin/app` (monorepo root). Single `node_modules` for both apps.
- Pull code (once SSH is enabled): `git clone` or `git pull` in `/home/gotrippin/app`.

### Domain / Docroot
- Main site `gotrippin.maxprogress.bg` → docroot: `/home/gotrippin/app` (avoid `public_html`).
- API `api.gotrippin.maxprogress.bg` → docroot: `/home/gotrippin/app` (or `/home/gotrippin/app/apps/backend` if required by UI, but keep installs at root).

### Node.js App Entries (two)
Frontend (Next):
- App root: `/home/gotrippin/app`
- Startup: `/home/gotrippin/app/apps/web/.next/standalone/server.js`
- Env: `NEXT_PUBLIC_API_URL=https://api.gotrippin.maxprogress.bg` + Supabase public vars.

Backend (Nest):
- App root: `/home/gotrippin/app`
- Startup: `/home/gotrippin/nodevenv/app/20/bin/node apps/backend/dist/main.js` (adjust nodevenv version if different)
- Env: backend secrets (DB URL, SUPABASE_SERVICE_KEY, JWT, etc.).

### Install & Build (run once at root)
```
cd /home/gotrippin/app
npm ci          # or npm install
npm run build   # runs workspace builds as defined
```
If UI only: “Run NPM Install” then run build scripts via “Run JS script”.

### Files Needed on Server
- Root: `package.json`, `package-lock.json`.
- Frontend: `.next/standalone`, `.next/static`, `public/`.
- Backend: `dist/`.
- Single `node_modules` at root.

### SSL
- After domains/subdomains are set and DNS points to host, run AutoSSL/Let’s Encrypt in cPanel for `gotrippin.maxprogress.bg` and `api.gotrippin.maxprogress.bg`.
- Use HTTPS URLs in env vars.

### Restart
- After installs/builds/envs, restart both Node apps from cPanel.

### Ongoing
- Pull updates in `/home/gotrippin/app`, rerun `npm ci` if deps change, rebuild, restart apps.

