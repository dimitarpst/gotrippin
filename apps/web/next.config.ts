import type { NextConfig } from "next";
import type { Configuration } from "webpack";

/**
 * React Refresh injects `import.meta.webpackHot`, which is invalid in CJS output.
 * Next only skips refresh for transpilePackages under `node_modules/<pkg>/`, but
 * workspace symlinks resolve to `packages/core/…`, so we must exclude those paths too.
 */
const GOTRIPPIN_CORE_NO_REACT_REFRESH = /[/\\](?:packages[/\\]core|node_modules[/\\]@gotrippin[/\\]core)[/\\]/;

type WebpackRules = NonNullable<NonNullable<Configuration["module"]>["rules"]>;

function useEntryHasReactRefresh(useEntry: unknown): boolean {
  if (typeof useEntry === "string") return useEntry.includes("react-refresh-utils");
  if (!useEntry || typeof useEntry !== "object") return false;
  const loader = Reflect.get(useEntry, "loader");
  return typeof loader === "string" && loader.includes("react-refresh-utils");
}

function excludeGotrippinCoreFromReactRefreshRules(rules: WebpackRules | undefined): void {
  if (!rules) return;
  for (const rule of rules) {
    if (rule === undefined || rule === null || rule === false || rule === "" || rule === 0) {
      continue;
    }
    if (typeof rule === "string") continue;
    if ("oneOf" in rule && Array.isArray(rule.oneOf)) {
      excludeGotrippinCoreFromReactRefreshRules(rule.oneOf);
      continue;
    }
    if ("rules" in rule && Array.isArray(rule.rules)) {
      excludeGotrippinCoreFromReactRefreshRules(rule.rules);
      continue;
    }
    if (!Array.isArray(rule.use)) continue;
    const hasReactRefresh = rule.use.some(useEntryHasReactRefresh);
    if (!hasReactRefresh) continue;

    const ex = rule.exclude;
    if (Array.isArray(ex)) {
      const already = ex.some((c) => c === GOTRIPPIN_CORE_NO_REACT_REFRESH);
      if (!already) {
        rule.exclude = [...ex, GOTRIPPIN_CORE_NO_REACT_REFRESH];
      }
    } else if (typeof ex === "function") {
      const prev = ex;
      rule.exclude = (resourcePath: string) => {
        if (GOTRIPPIN_CORE_NO_REACT_REFRESH.test(resourcePath)) return true;
        return prev(resourcePath);
      };
    } else if (ex === undefined) {
      rule.exclude = GOTRIPPIN_CORE_NO_REACT_REFRESH;
    } else {
      rule.exclude = [ex, GOTRIPPIN_CORE_NO_REACT_REFRESH];
    }
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  /** Let Next transpile the workspace package; see webpack tweak for React Refresh + symlink paths. */
  transpilePackages: ["@gotrippin/core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer && config.module?.rules) {
      excludeGotrippinCoreFromReactRefreshRules(config.module.rules);
    }
    // Prefer symlink path for workspace deps so Next’s own transpilePackages refresh excludes match.
    if (dev) {
      config.resolve = config.resolve ?? {};
      config.resolve.symlinks = false;
    }
    return config;
  },
};

export default nextConfig;
