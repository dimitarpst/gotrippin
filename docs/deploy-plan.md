# Deployment Plan (Shared Hosting - SuperHosting)

### Access & Repo
- Enable SSH for your user in cPanel (contact support if needed).
- Connect: `ssh -i <key> gotrippin@<host> -p <port>` (use your actual key path, host, and port).
- Clone repo into `/home/gotrippin/app` (NOT `public_html` - cPanel doesn't allow Node.js apps in `public_html`): 
  ```bash
  cd /home/gotrippin
  git clone <repo-url> app
  ```
- Workdir: `/home/gotrippin/app` (monorepo root). Single `node_modules` for both apps.
- For updates: `cd /home/gotrippin/app && git pull`.

### Domain / Docroot
- Main site `gotrippin.app` → docroot: `public_html` (parked domain, but Node.js app runs from `/home/gotrippin/app`).
- API `api.gotrippin.app` → docroot: `/home/gotrippin/app/apps/backend` (or `/home/gotrippin/app` if UI requires root).
- **Important:** Domain docroot (`public_html`) and Node.js app root (`/home/gotrippin/app`) are separate. cPanel proxies requests from the domain to the Node.js app.

### Node.js App Entries (two)
**Frontend (Next):**
- App root: `/home/gotrippin/app`
- Startup: `/home/gotrippin/app/apps/web/.next/standalone/apps/web/server.js` (note: standalone creates nested `apps/web/` structure)
- Mode: `Production`
- Env (set in cPanel and used at **build time** locally via `.env.local`):
  - `NEXT_PUBLIC_SITE_URL` → `http://localhost:3000` (dev) / `https://gotrippin.app` (prod)
  - `NEXT_PUBLIC_API_URL` → `http://localhost:3001` (dev) / `https://api.gotrippin.app` (prod)
  - Supabase public vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`).

**Backend (Nest):**
- App root: `/home/gotrippin/app`
- Startup: `/home/gotrippin/nodevenv/app/20/bin/node apps/backend/dist/main.js` (adjust nodevenv version if different)
- Env (read at **runtime** via `ConfigService`):
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (and other secrets like JWT, DB URL)
  - `FRONTEND_ORIGIN_DEV` → `http://localhost:3000`
  - `FRONTEND_ORIGIN_PROD` → `https://gotrippin.app`

### Install & Build

**Option A: Build on server (slow, may hit resource limits)**
```bash
cd /home/gotrippin/app
source /home/gotrippin/nodevenv/app/20/bin/activate  # activate Node venv
npm ci --omit=dev                                    # install prod deps only
npm --prefix apps/web run build                      # build Next.js app
```

**Option B: Build locally and upload (recommended)**
1. Build locally: `npm --prefix apps/web run build`
2. Upload to server:
   - `apps/web/.next/standalone/` → `/home/gotrippin/app/apps/web/.next/standalone/`
   - `apps/web/.next/static/` → `/home/gotrippin/app/apps/web/.next/static/`
3. On server: `npm ci --omit=dev` (for node_modules)

### Critical: Static Files Symlink Fix
Next.js standalone mode expects static files at `.next/static` relative to the server.js location. After build:

```bash
cd /home/gotrippin/app/apps/web/.next/standalone/apps/web
ln -s /home/gotrippin/app/apps/web/.next/static .next/static
```

This creates a symlink so the standalone server can find static assets. **Without this, you'll get 404s for all JS/CSS files.**

### Files Needed on Server
- Root: `package.json`, `package-lock.json`.
- Frontend: 
  - `apps/web/.next/standalone/apps/web/server.js` (startup file)
  - `apps/web/.next/static/` (static assets - symlinked to standalone)
  - `apps/web/public/` (public assets)
- Backend: `apps/backend/dist/`.
- Single `node_modules` at root (`/home/gotrippin/app/node_modules`).

### SSL
- After domains/subdomains are set and DNS points to host, run AutoSSL/Let's Encrypt in cPanel for `gotrippin.app` and `api.gotrippin.app`.
- Use HTTPS URLs in env vars (`NEXT_PUBLIC_API_URL=https://api.gotrippin.app`).

### Restart
- After installs/builds/envs/symlink, restart both Node apps from cPanel.
- Check logs if errors occur: `/home/gotrippin/logs/passenger.log`

### Common Issues
- **404s for static files:** Ensure symlink exists (see "Static Files Symlink Fix" above)
- **API calls to localhost:** Check `NEXT_PUBLIC_API_URL` env var is set correctly in cPanel
- **Build fails:** Try building locally and uploading instead
- **Disk space:** Clean `.npm` cache: `rm -rf /home/gotrippin/.npm/*`

### Ongoing
- Pull updates: `cd /home/gotrippin/app && git pull`
- If deps change: `npm ci --omit=dev`, rebuild, recreate symlink, restart apps.
