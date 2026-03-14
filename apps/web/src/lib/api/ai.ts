/**
 * AI API client
 */

import { appConfig } from "@/config/appConfig";
import { getAuthToken } from "./auth";

const API_BASE = appConfig.apiUrl;

export interface AiImageSuggestion {
  id: string;
  thumbnail_url: string;
  blur_hash: string | null;
  photographer_name: string;
  photographer_url: string;
}

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

export interface AiSessionListItem {
  id: string;
  scope: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
  trip_id?: string | null;
}

export interface AiSessionWithMessagesResponse {
  session: {
    id: string;
    scope: string;
    summary: string | null;
    created_at: string;
    updated_at: string;
  };
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    quick_replies?: Array<{ label: string; action: string }>;
    image_suggestions?: AiImageSuggestion[];
  }>;
}

const DEFAULT_PAGE_SIZE = 20;

export interface ListAiSessionsOptions {
  limit?: number;
  offset?: number;
  tripId?: string | null;
  token?: string | null;
}

export async function listAiSessions(
  scope: "global" | "trip" = "global",
  options?: ListAiSessionsOptions | string | null
): Promise<AiSessionListItem[]> {
  const opts: ListAiSessionsOptions =
    options != null && typeof options === "object" ? options : { token: options ?? undefined };
  const authToken = opts.token ?? (await getAuthToken());
  if (!authToken) throw new Error("Authentication required");
  const params = new URLSearchParams({ scope });
  if (scope === "trip" && opts.tripId) params.set("trip_id", opts.tripId);
  const limit = Math.min(Math.max(opts.limit ?? DEFAULT_PAGE_SIZE, 1), 50);
  const offset = Math.max(opts.offset ?? 0, 0);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const res = await fetch(`${API_BASE}/ai/sessions?${params}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getAiSessionWithMessages(
  sessionId: string,
  token?: string | null
): Promise<AiSessionWithMessagesResponse> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) throw new Error("Authentication required");
  const res = await fetch(`${API_BASE}/ai/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Session not found");
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function updateAiSessionSummary(
  sessionId: string,
  summary: string | null,
  token?: string | null
): Promise<AiSessionListItem> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) throw new Error("Authentication required");
  const res = await fetch(`${API_BASE}/ai/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ summary: summary ?? null }),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Session not found");
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteAiSession(
  sessionId: string,
  token?: string | null
): Promise<void> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) throw new Error("Authentication required");
  const res = await fetch(`${API_BASE}/ai/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok && res.status !== 204) {
    if (res.status === 404) throw new Error("Session not found");
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Request failed: ${res.status}`);
  }
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

export interface PostMessageResponse {
  message: string;
  quick_replies?: Array<{ label: string; action: string }>;
  image_suggestions?: AiImageSuggestion[];
  tool_calls?: string[];
  usage?: { used: number; limit: number | null; percent: number | null };
}

export interface PostAiMessageOptions {
  token?: string | null;
  signal?: AbortSignal;
}

export async function postAiMessage(
  sessionId: string,
  message: string,
  options?: PostAiMessageOptions | string | null
): Promise<PostMessageResponse> {
  const opts: PostAiMessageOptions =
    options != null && typeof options === "object" ? options : { token: options ?? undefined };
  const authToken = opts.token ?? (await getAuthToken());
  if (!authToken) {
    throw new Error("Authentication required");
  }

  const res = await fetch(`${API_BASE}/ai/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ message }),
    signal: opts.signal,
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
