## Deployment Plan (Shared Hosting - SuperHosting)

### Access & Repo
- Enable SSH for your user in cPanel (contact support if needed).
- Connect: `ssh -i <key> gotrippin@<host> -p <port>` (use your actual key path, host, and port).
- Clone repo into `public_html`: 
  ```bash
  cd /home/gotrippin/public_html
  git clone <repo-url> .
  ```
- Workdir: `/home/gotrippin/public_html` (monorepo root). Single `node_modules` for both apps.
- For updates: `cd /home/gotrippin/public_html && git pull`.

### Domain / Docroot
- Main site `gotrippin.maxprogress.bg` → docroot: `/home/gotrippin/public_html` (default for shared hosting).
- API `api.gotrippin.maxprogress.bg` → docroot: `/home/gotrippin/public_html/apps/backend` (or `/home/gotrippin/public_html` if UI requires root, but Node apps handle routing).

### Node.js App Entries (two)
**Frontend (Next):**
- App root: `/home/gotrippin/public_html`
- Startup: `/home/gotrippin/public_html/apps/web/.next/standalone/server.js`
- Env: `NEXT_PUBLIC_API_URL=https://api.gotrippin.maxprogress.bg` + Supabase public vars.

**Backend (Nest):**
- App root: `/home/gotrippin/public_html`
- Startup: `/home/gotrippin/nodevenv/app/20/bin/node apps/backend/dist/main.js` (adjust nodevenv version if different)
- Env: backend secrets (DB URL, SUPABASE_SERVICE_KEY, JWT, etc.).

### Install & Build (run once at root)
```bash
cd /home/gotrippin/public_html
source /home/gotrippin/nodevenv/app/20/bin/activate  # optional, to match cPanel env
npm ci          # or npm install
npm run build   # runs workspace builds as defined
```
If UI only: "Run NPM Install" then run build scripts via "Run JS script".

### Files Needed on Server
- Root: `package.json`, `package-lock.json`.
- Frontend: `apps/web/.next/standalone`, `apps/web/.next/static`, `apps/web/public/`.
- Backend: `apps/backend/dist/`.
- Single `node_modules` at root (`/home/gotrippin/public_html/node_modules`).

### SSL
- After domains/subdomains are set and DNS points to host, run AutoSSL/Let's Encrypt in cPanel for `gotrippin.maxprogress.bg` and `api.gotrippin.maxprogress.bg`.
- Use HTTPS URLs in env vars (`NEXT_PUBLIC_API_URL=https://api.gotrippin.maxprogress.bg`).

### Restart
- After installs/builds/envs, restart both Node apps from cPanel.

### Ongoing
- Pull updates: `cd /home/gotrippin/public_html && git pull`
- If deps change: `npm ci`, rebuild, restart apps.

