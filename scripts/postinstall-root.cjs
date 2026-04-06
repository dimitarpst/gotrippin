/**
 * Monorepo postinstall: build @gotrippin/core, then apply root `patches/`.
 * Resolves `patch-package` via apps/web so CI (e.g. Vercel) always has a real
 * install path; runs the CLI with cwd = repo root so `patches/` is found.
 */
const { execFileSync, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const root = path.join(__dirname, "..");

execSync("npm run build --workspace=@gotrippin/core", {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

const webPkgJson = path.join(root, "apps", "web", "package.json");
if (!fs.existsSync(webPkgJson)) {
  console.error("[postinstall] apps/web/package.json not found");
  process.exit(1);
}

const requireWeb = createRequire(webPkgJson);

let patchPackageIndex;
try {
  patchPackageIndex = requireWeb.resolve("patch-package/index.js");
} catch {
  console.error(
    "[postinstall] patch-package missing; it should be a devDependency of apps/web.",
  );
  process.exit(1);
}

execFileSync(process.execPath, [patchPackageIndex], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
