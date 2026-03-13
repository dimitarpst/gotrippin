import { appConfig } from "@/config/appConfig";

export const dynamic = "force-dynamic";

async function pingBackend() {
  const apiUrl = appConfig.apiUrl;

  if (!apiUrl) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_API_URL is not configured.",
    };
  }

  const url = `${apiUrl}/health`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const body = await response
      .json()
      .catch(() => ({ status: "unknown", supabase: false }));

    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export default async function UptimePage() {
  const result = await pingBackend();

  const lines = [
    "uptime-ok",
    typeof result.status === "number" ? `backend_status=${result.status}` : null,
    result.body && typeof result.body.status === "string"
      ? `backend_body_status=${result.body.status}`
      : null,
    result.body && typeof result.body.supabase === "boolean"
      ? `supabase=${result.body.supabase ? "ok" : "error"}`
      : null,
    result.message ? `message=${result.message}` : null,
  ].filter(Boolean);

  return (
    <pre>
      {lines.join("\n")}
    </pre>
  );
}

