"use client";

import { useState } from "react";
import { createAiSession } from "@/lib/api/ai";
import { Button } from "@/components/ui/button";

export default function AiTestClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateSession() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await createAiSession({ scope: "global" });
      setResult(
        JSON.stringify(
          {
            session_id: data.session_id,
            welcome_message: data.welcome_message,
          },
          null,
          2
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
      console.error("[AiTestClient] createSession failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">AI session test</h1>
      <p className="text-muted-foreground text-sm">
        Uses your current session — no token copy-paste.
      </p>
      <Button onClick={handleCreateSession} disabled={loading}>
        {loading ? "Creating…" : "Create global session"}
      </Button>
      {result && (
        <pre className="rounded-md bg-muted p-4 text-sm overflow-auto">
          {result}
        </pre>
      )}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive font-medium">Error</p>
          <p className="text-destructive/90 text-sm mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
