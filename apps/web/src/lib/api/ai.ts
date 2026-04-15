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

export interface AiCoverPick {
  image_url: string;
  blur_hash: string | null;
  photographer_name: string;
  photographer_url: string;
}

export interface AiPlaceSuggestion {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  place_type?: string | null;
  place_id?: string | null;
  photo_url?: string | null;
  phone_number?: string | null;
  website?: string | null;
  weekday_hours?: string[] | null;
  visit_time?: string | null;
  ai_note?: string | null;
}

export interface AiBudgetSummary {
  currency: string;
  per_person_estimate: number;
  assumptions?: string[];
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

/** Persisted on user messages when trip context was attached for that send (global chats). */
export interface AiAttachedTripPreview {
  id: string;
  title: string;
  destination: string | null;
  image_url: string | null;
  blur_hash: string | null;
}

export interface AiSessionWithMessagesResponse {
  session: {
    id: string;
    scope: string;
    summary: string | null;
    created_at: string;
    updated_at: string;
    /** When scope is trip, the trip this chat is bound to. */
    trip_id?: string | null;
    /** UUID of draft trip when createTripDraft has run (from session slots). */
    current_trip_id?: string;
  };
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    linked_trip_id?: string;
    /** User message: trip attached for this message (global scope). */
    attached_trip?: AiAttachedTripPreview;
    cover_pick?: AiCoverPick;
    quick_replies?: Array<{ label: string; action: string }>;
    image_suggestions?: AiImageSuggestion[];
    place_suggestions?: AiPlaceSuggestion[];
    tool_calls?: string[];
    budget_summary?: AiBudgetSummary;
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
  linked_trip_id?: string;
  quick_replies?: Array<{ label: string; action: string }>;
  image_suggestions?: AiImageSuggestion[];
  place_suggestions?: AiPlaceSuggestion[];
  tool_calls?: string[];
  budget_summary?: AiBudgetSummary;
  usage?: { used: number; limit: number | null; percent: number | null };
}

export interface PostAiMessageOptions {
  token?: string | null;
  signal?: AbortSignal;
  /** Global-scope sessions only: attach full trip snapshot for this request (merged into session slots on the server). */
  attached_trip_id?: string | null;
}

export type AiStreamProgressLine =
  | { type: "phase"; phase: string }
  | { type: "tool"; phase: "start" | "done"; name: string };

/**
 * POST message with NDJSON progress (one JSON object per line), last line `{ type: "done", payload }`.
 */
export async function postAiMessageStream(
  sessionId: string,
  message: string,
  onProgress: (line: AiStreamProgressLine) => void,
  options?: PostAiMessageOptions | string | null,
): Promise<PostMessageResponse> {
  const opts: PostAiMessageOptions =
    options != null && typeof options === "object" ? options : { token: options ?? undefined };
  const authToken = opts.token ?? (await getAuthToken());
  if (!authToken) {
    throw new Error("Authentication required");
  }

  const body: { message: string; attached_trip_id?: string } = { message };
  if (opts.attached_trip_id) {
    body.attached_trip_id = opts.attached_trip_id;
  }

  const res = await fetch(`${API_BASE}/ai/sessions/${sessionId}/messages/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.message ?? `Request failed: ${res.status}`;
    const errWithStatus = new Error(`${msg} (${res.status})`);
    (errWithStatus as Error & { status?: number }).status = res.status;
    throw errWithStatus;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload: PostMessageResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        throw new Error("Invalid stream line from AI");
      }
      if (!parsed || typeof parsed !== "object") continue;
      const rec = parsed as Record<string, unknown>;
      if (rec.type === "done" && rec.payload && typeof rec.payload === "object") {
        finalPayload = rec.payload as PostMessageResponse;
        continue;
      }
      if (rec.type === "error" && typeof rec.message === "string") {
        throw new Error(rec.message);
      }
      if (rec.type === "phase" && typeof rec.phase === "string") {
        onProgress({ type: "phase", phase: rec.phase });
      } else if (
        rec.type === "tool" &&
        (rec.phase === "start" || rec.phase === "done") &&
        typeof rec.name === "string"
      ) {
        onProgress({ type: "tool", phase: rec.phase, name: rec.name });
      }
    }
  }

  if (!finalPayload) {
    throw new Error("AI stream ended without a result");
  }
  return finalPayload;
}

export async function postAiMessage(
  sessionId: string,
  message: string,
  options?: PostAiMessageOptions | string | null
): Promise<PostMessageResponse> {
  return postAiMessageStream(sessionId, message, () => {}, options);
}

export interface SelectCoverImageBody {
  /** 1-based index matching the numbered card in the picker */
  index: number;
  answers_summary?: string;
}

export interface SelectCoverImageResponse {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    cover_pick?: AiCoverPick;
    linked_trip_id?: string;
  }>;
}

export async function selectSessionCoverImage(
  sessionId: string,
  body: SelectCoverImageBody,
  options?: PostAiMessageOptions | string | null
): Promise<SelectCoverImageResponse> {
  const opts: PostAiMessageOptions =
    options != null && typeof options === "object" ? options : { token: options ?? undefined };
  const authToken = opts.token ?? (await getAuthToken());
  if (!authToken) {
    throw new Error("Authentication required");
  }

  const res = await fetch(`${API_BASE}/ai/sessions/${sessionId}/select-cover-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
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
