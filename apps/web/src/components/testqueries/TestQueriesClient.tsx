"use client";

import { useState, useCallback } from "react";
import { appConfig } from "@/config/appConfig";
import { useAuth } from "@/contexts/AuthContext";

interface ProbeResult {
  endpoint: string;
  status: "idle" | "loading" | "ok" | "error";
  statusCode?: number;
  message?: string;
  duration?: number;
}

export default function TestQueriesClient() {
  const { accessToken } = useAuth();
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [running, setRunning] = useState(false);

  const probe = useCallback(async (endpoint: string, options?: RequestInit) => {
    const start = performance.now();
    try {
      const url = `${appConfig.apiUrl}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          ...options?.headers,
        },
      });
      const duration = Math.round(performance.now() - start);
      const data = await res.json().catch(() => ({}));
      return {
        endpoint,
        status: res.ok ? ("ok" as const) : ("error" as const),
        statusCode: res.status,
        message: data.message ?? data.status ?? (res.ok ? "OK" : res.statusText),
        duration,
      };
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      return {
        endpoint,
        status: "error" as const,
        message: err instanceof Error ? err.message : "Network error",
        duration,
      };
    }
  }, [accessToken]);

  const runAll = useCallback(async () => {
    setRunning(true);
    setResults((prev) =>
      prev.map((r) => (r.status === "loading" ? r : { ...r, status: "idle" as const }))
    );

    const endpoints: { path: string; options?: RequestInit }[] = [
      { path: "/auth/health" },
      ...(accessToken ? [{ path: "/trips" }, { path: "/auth/me" }] : []),
    ];

    for (const { path } of endpoints) {
      setResults((prev) => {
        const next = [...prev];
        const idx = next.findIndex((r) => r.endpoint === path);
        const item = { endpoint: path, status: "loading" as const };
        if (idx >= 0) next[idx] = item;
        else next.push(item);
        return next;
      });
      const result = await probe(path);
      setResults((prev) =>
        prev.map((r) => (r.endpoint === path ? result : r))
      );
    }

    setRunning(false);
  }, [accessToken, probe]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] p-6 font-mono text-sm">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-xl font-bold">API Diagnostics</h1>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
          <p><span className="text-white/60">API URL:</span> {appConfig.apiUrl || "(empty)"}</p>
          <p><span className="text-white/60">Site URL:</span> {appConfig.siteUrl || "(empty)"}</p>
          <p><span className="text-white/60">Auth:</span> {accessToken ? "Logged in" : "Not logged in"}</p>
        </div>

        <button
          onClick={runAll}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-[#ff6b6b] text-white font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {running ? "Probing…" : "Probe endpoints"}
        </button>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.endpoint}
                className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-4"
              >
                <code className="text-white/80">{r.endpoint}</code>
                <div className="flex items-center gap-3 text-right">
                  {r.status === "loading" && <span className="text-amber-400">…</span>}
                  {r.status === "ok" && (
                    <>
                      <span className="text-emerald-400">{r.statusCode}</span>
                      {r.duration != null && <span className="text-white/50">{r.duration}ms</span>}
                    </>
                  )}
                  {r.status === "error" && (
                    <>
                      {r.statusCode != null && <span className="text-red-400">{r.statusCode}</span>}
                      <span className="text-red-300/90">{r.message}</span>
                      {r.duration != null && <span className="text-white/50">{r.duration}ms</span>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-white/50 text-xs">
          /auth/health does not require login. /trips and /auth/me require a valid session.
        </p>
      </div>
    </div>
  );
}
