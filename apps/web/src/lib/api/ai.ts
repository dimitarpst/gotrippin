/**
 * AI API client
 */

import { appConfig } from "@/config/appConfig";
import { getAuthToken } from "./auth";

const API_BASE = appConfig.apiUrl;

export interface CreateSessionBody {
  scope: "global" | "trip";
  trip_id?: string;
  initial_message?: string;
}

export interface CreateSessionResponse {
  session_id: string;
  session: {
    id: string;
    user_id: string;
    trip_id: string | null;
    scope: string;
    summary: string | null;
    slots: Record<string, unknown>;
    model_name: string;
    created_at: string;
    updated_at: string;
  };
  welcome_message?: string;
}

export async function createAiSession(
  body: CreateSessionBody,
  token?: string | null
): Promise<CreateSessionResponse> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) {
    throw new Error("Authentication required");
  }

  const res = await fetch(`${API_BASE}/ai/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.message ?? `Request failed: ${res.status}`;
    const errWithStatus = new Error(`${msg} (${res.status})`);
    (errWithStatus as Error & { status?: number }).status = res.status;
    throw errWithStatus;
  }

  return res.json();
}
