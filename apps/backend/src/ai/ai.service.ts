import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenRouterClient } from './openrouter.client';
import { CreateSessionDto } from './dto/create-session.dto';
import { PostMessageDto } from './dto/post-message.dto';
import type { SelectCoverImageBody } from './dto/select-cover-image.dto';
import { ToolExecutor } from './tools/tool-executor';
import { AI_TOOLS } from './tools/tool-definitions';
import type { OpenRouterMessage } from './openrouter.client';

export interface AiSessionRow {
  id: string;
  user_id: string;
  trip_id: string | null;
  scope: string;
  summary: string | null;
  slots: Record<string, unknown>;
  model_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionResult {
  session_id: string;
  session: AiSessionRow;
  welcome_message?: string;
}

/** NDJSON stream events for live progress (optional on postMessage). */
export type AiMessageProgressEvent =
  | { type: 'phase'; phase: string }
  | { type: 'tool'; phase: 'start' | 'done'; name: string };

export interface PostMessageResult {
  message: string;
  /** Trip created or linked in this turn (from session slots); client can link to /trips/:id */
  linked_trip_id?: string;
  quick_replies?: Array<{ label: string; action: string }>;
  image_suggestions?: Array<{
    id: string;
    thumbnail_url: string;
    blur_hash: string | null;
    photographer_name: string;
    photographer_url: string;
  }>;
  place_suggestions?: Array<{
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
  }>;
  /** Tool function names executed during this turn, in order */
  tool_calls?: string[];
  budget_summary?: {
    currency: string;
    per_person_estimate: number;
    assumptions?: string[];
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly openRouter: OpenRouterClient,
    private readonly toolExecutor: ToolExecutor,
  ) {}

  async listSessions(
    userId: string,
    scope: 'global' | 'trip' = 'global',
    tripId?: string | null,
    opts?: { limit?: number; offset?: number },
  ) {
    return this.supabaseService.listAiSessions(userId, {
      scope,
      trip_id: tripId ?? undefined,
      limit: opts?.limit ?? 20,
      offset: opts?.offset ?? 0,
    });
  }

  async updateSessionSummary(
    userId: string,
    sessionId: string,
    summary: string | null,
  ) {
    const { data: session, error } = await this.supabaseService.getAiSession(
      sessionId,
      userId,
    );
    if (error || !session) {
      throw new NotFoundException('Session not found');
    }
    return this.supabaseService.updateAiSession(sessionId, userId, {
      summary: summary?.trim() || null,
    });
  }

  async deleteSession(userId: string, sessionId: string) {
    const { data: session, error } = await this.supabaseService.getAiSession(
      sessionId,
      userId,
    );
    if (error || !session) {
      throw new NotFoundException('Session not found');
    }
    await this.supabaseService.deleteAiSession(sessionId, userId);
  }

  /**
   * Applies a cover from the pending Unsplash gallery without a fake "Use image N" chat message.
   * Inserts a user row (with cover_pick for the UI) and a short assistant confirmation.
   */
  async selectCoverFromGallery(
    userId: string,
    sessionId: string,
    dto: SelectCoverImageBody,
  ): Promise<{
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      cover_pick?: {
        image_url: string;
        blur_hash: string | null;
        photographer_name: string;
        photographer_url: string;
      };
      linked_trip_id?: string;
    }>;
  }> {
    const { data: session, error } = await this.supabaseService.getAiSession(
      sessionId,
      userId,
    );
    if (error || !session) {
      throw new NotFoundException('Session not found');
    }

    const slots: Record<string, unknown> = {
      ...((session.slots as Record<string, unknown> | null | undefined) ?? {}),
    };
    const tripIdRaw = slots.current_trip_id;
    if (typeof tripIdRaw !== 'string' || !tripIdRaw.trim()) {
      throw new BadRequestException(
        'No trip is linked to this chat yet. Create or open a trip first, then pick a cover.',
      );
    }
    const tripId = tripIdRaw.trim();

    const pendingRaw = slots.pending_cover_images;
    if (!Array.isArray(pendingRaw) || pendingRaw.length === 0) {
      throw new BadRequestException(
        'There are no cover images to choose from. Ask the assistant for cover options first.',
      );
    }

    const idx = dto.index - 1;
    if (idx < 0 || idx >= pendingRaw.length) {
      throw new BadRequestException(
        `Invalid image index. Choose between 1 and ${pendingRaw.length}.`,
      );
    }

    const rawPhoto = pendingRaw[idx];
    if (!rawPhoto || typeof rawPhoto !== 'object' || Array.isArray(rawPhoto)) {
      throw new BadRequestException('Invalid pending image entry.');
    }
    const photo = rawPhoto as Record<string, unknown>;
    const unsplash_photo_id =
      typeof photo.unsplash_photo_id === 'string' ? photo.unsplash_photo_id : '';
    const download_location =
      typeof photo.download_location === 'string' ? photo.download_location : '';
    const image_url = typeof photo.image_url === 'string' ? photo.image_url : '';
    const photographer_name =
      typeof photo.photographer_name === 'string' ? photo.photographer_name : '';
    const photographer_url =
      typeof photo.photographer_url === 'string' ? photo.photographer_url : '';
    if (
      !unsplash_photo_id ||
      !download_location ||
      !image_url ||
      !photographer_name ||
      !photographer_url
    ) {
      throw new BadRequestException('Pending image is missing required fields.');
    }
    const blur_hash =
      photo.blur_hash == null
        ? null
        : typeof photo.blur_hash === 'string'
          ? photo.blur_hash
          : null;
    const dominant_color =
      photo.dominant_color == null
        ? null
        : typeof photo.dominant_color === 'string'
          ? photo.dominant_color
          : null;

    await this.toolExecutor.execute(
      'selectCoverImage',
      {
        trip_id: tripId,
        unsplash_photo_id,
        download_location,
        image_url,
        photographer_name,
        photographer_url,
        blur_hash,
        dominant_color,
      },
      userId,
    );

    const nextSlots = { ...slots };
    delete nextSlots.pending_cover_images;
    await this.supabaseService.updateAiSession(sessionId, userId, {
      slots: nextSlots,
    });

    const userText = dto.answers_summary?.trim()
      ? `${dto.answers_summary.trim()}\n\nSelected trip cover`
      : 'Selected trip cover';

    const coverPick = {
      image_url,
      blur_hash,
      photographer_name,
      photographer_url,
    };

    await this.supabaseService.insertAiMessage(sessionId, 'user', {
      text: userText,
      cover_pick: coverPick,
    });

    const assistantText =
      'Your trip cover is set — this photo is now your trip cover. Open the trip anytime to adjust details.';

    await this.supabaseService.insertAiMessage(sessionId, 'assistant', {
      text: assistantText,
      linked_trip_id: tripId,
    });

    return {
      messages: [
        {
          role: 'user',
          content: userText,
          cover_pick: coverPick,
        },
        {
          role: 'assistant',
          content: assistantText,
          linked_trip_id: tripId,
        },
      ],
    };
  }

  async getSessionWithMessages(userId: string, sessionId: string) {
    const { data: session, error } = await this.supabaseService.getAiSession(
      sessionId,
      userId,
    );
    if (error || !session) {
      throw new NotFoundException('Session not found');
    }
    const rows = await this.supabaseService.getAiMessages(sessionId, 100);
    const messages = rows
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => {
        const c = m.content as Record<string, unknown>;
        let text = c?.text != null ? String(c.text) : '';
        if (m.role === 'user' && text) {
          if (text.startsWith('just_chat:'))
            text = text.slice('just_chat:'.length).trim() || 'Just chat';
          else if (text.startsWith('create_trip:'))
            text = text.slice('create_trip:'.length).trim() || 'Create a trip';
          else if (text.startsWith('find_images:'))
            text = text.slice('find_images:'.length).trim() || 'Find images';
          else if (text === 'just_chat') text = 'Just chat';
          else if (text === 'create_trip') text = 'Create a trip';
          else if (text === 'find_images') text = 'Find images';
          else if (text === '—') text = 'Selected an action';
        }

        const quickRepliesRaw = c?.quick_replies;
        const quick_replies =
          Array.isArray(quickRepliesRaw) && quickRepliesRaw.length > 0
            ? quickRepliesRaw.map((qr) => ({
                label: String((qr as { label?: unknown }).label ?? ''),
                action: String((qr as { action?: unknown }).action ?? ''),
              }))
            : undefined;

        const imagesRaw = c?.image_suggestions;
        const image_suggestions =
          Array.isArray(imagesRaw) && imagesRaw.length > 0
            ? imagesRaw.map((img) => ({
                id: String((img as { id?: unknown }).id ?? ''),
                thumbnail_url: String(
                  (img as { thumbnail_url?: unknown }).thumbnail_url ?? '',
                ),
                blur_hash:
                  (img as { blur_hash?: unknown }).blur_hash != null
                    ? String(
                        (img as { blur_hash?: unknown }).blur_hash as string,
                      )
                    : null,
                photographer_name: String(
                  (img as { photographer_name?: unknown }).photographer_name ??
                    '',
                ),
                photographer_url: String(
                  (img as { photographer_url?: unknown }).photographer_url ??
                    '',
                ),
              }))
            : undefined;

        const placesRaw = c?.place_suggestions;
        const place_suggestions =
          Array.isArray(placesRaw) && placesRaw.length > 0
            ? placesRaw
                .map((item) => {
                  if (!item || typeof item !== 'object') return null;
                  const place = item as Record<string, unknown>;
                  const nameValue = place.name;
                  if (typeof nameValue !== 'string' || !nameValue.trim()) return null;
                  const weekdayHoursValue = place.weekday_hours;
                  const weekdayHours =
                    Array.isArray(weekdayHoursValue)
                      ? weekdayHoursValue
                          .filter((line) => typeof line === 'string' && line.trim().length > 0)
                          .map((line) => String(line))
                      : [];
                  const numberOrNull = (value: unknown): number | null =>
                    typeof value === 'number' && Number.isFinite(value) ? value : null;
                  const stringOrNull = (value: unknown): string | null =>
                    typeof value === 'string' && value.trim().length > 0 ? value : null;
                  return {
                    name: nameValue.trim(),
                    address: stringOrNull(place.address),
                    latitude: numberOrNull(place.latitude),
                    longitude: numberOrNull(place.longitude),
                    rating: numberOrNull(place.rating),
                    rating_count: numberOrNull(place.rating_count),
                    place_type: stringOrNull(place.place_type),
                    place_id: stringOrNull(place.place_id),
                    photo_url: stringOrNull(place.photo_url),
                    phone_number: stringOrNull(place.phone_number),
                    website: stringOrNull(place.website),
                    weekday_hours: weekdayHours.length ? weekdayHours : null,
                    visit_time: stringOrNull(place.visit_time),
                    ai_note: stringOrNull(place.ai_note),
                  };
                })
                .filter((item) => item != null)
            : undefined;

        const linkedTripRaw = c?.linked_trip_id;
        const linked_trip_id =
          m.role === 'assistant' &&
          typeof linkedTripRaw === 'string' &&
          linkedTripRaw.trim().length > 0
            ? linkedTripRaw.trim()
            : undefined;

        const coverPickRaw = c?.cover_pick;
        let cover_pick:
          | {
              image_url: string;
              blur_hash: string | null;
              photographer_name: string;
              photographer_url: string;
            }
          | undefined;
        if (
          m.role === 'user' &&
          coverPickRaw &&
          typeof coverPickRaw === 'object' &&
          !Array.isArray(coverPickRaw)
        ) {
          const cp = coverPickRaw as Record<string, unknown>;
          const imageUrl =
            typeof cp.image_url === 'string' ? cp.image_url.trim() : '';
          if (imageUrl) {
            const bh = cp.blur_hash;
            cover_pick = {
              image_url: imageUrl,
              blur_hash:
                bh == null ? null : typeof bh === 'string' ? bh : null,
              photographer_name:
                typeof cp.photographer_name === 'string'
                  ? cp.photographer_name
                  : '',
              photographer_url:
                typeof cp.photographer_url === 'string'
                  ? cp.photographer_url
                  : '',
            };
          }
        }

        const toolCallsRaw = c?.tool_calls;
        const tool_calls =
          m.role === 'assistant' &&
          Array.isArray(toolCallsRaw) &&
          toolCallsRaw.length > 0
            ? toolCallsRaw
                .filter((t) => typeof t === 'string' && t.trim().length > 0)
                .map((t) => String(t).trim())
            : undefined;

        const budgetRaw = c?.budget_summary;
        let budget_summary:
          | {
              currency: string;
              per_person_estimate: number;
              assumptions?: string[];
            }
          | undefined;
        if (
          m.role === 'assistant' &&
          budgetRaw &&
          typeof budgetRaw === 'object' &&
          !Array.isArray(budgetRaw)
        ) {
          const b = budgetRaw as Record<string, unknown>;
          const cur = b.currency;
          const est = b.per_person_estimate;
          const asm = b.assumptions;
          if (typeof cur === 'string' && cur.trim() && typeof est === 'number' && Number.isFinite(est)) {
            const assumptionsList =
              Array.isArray(asm)
                ? asm
                    .filter((a) => typeof a === 'string' && a.trim().length > 0)
                    .map((a) => String(a).trim())
                : [];
            budget_summary = {
              currency: cur.trim().toUpperCase(),
              per_person_estimate: est,
              ...(assumptionsList.length > 0 ? { assumptions: assumptionsList } : {}),
            };
          }
        }

        return {
          role: m.role as 'user' | 'assistant',
          content: text,
          ...(quick_replies ? { quick_replies } : {}),
          ...(image_suggestions ? { image_suggestions } : {}),
          ...(place_suggestions ? { place_suggestions } : {}),
          ...(linked_trip_id ? { linked_trip_id } : {}),
          ...(cover_pick ? { cover_pick } : {}),
          ...(tool_calls && tool_calls.length > 0 ? { tool_calls } : {}),
          ...(budget_summary ? { budget_summary } : {}),
        };
      });
    const slotsRaw = session.slots;
    let currentTripId: string | undefined;
    if (slotsRaw && typeof slotsRaw === 'object' && !Array.isArray(slotsRaw)) {
      const id = (slotsRaw as Record<string, unknown>).current_trip_id;
      if (typeof id === 'string' && id.trim().length > 0) {
        currentTripId = id.trim();
      }
    }

    return {
      session: {
        id: session.id,
        scope: session.scope,
        summary: session.summary,
        created_at: session.created_at,
        updated_at: session.updated_at,
        ...(currentTripId ? { current_trip_id: currentTripId } : {}),
      },
      messages,
    };
  }

  async createSession(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<CreateSessionResult> {
    const scope = dto.scope;
    const tripId = dto.trip_id ?? null;

    if (scope === 'trip') {
      if (!tripId) {
        throw new BadRequestException('trip_id is required when scope is "trip".');
      }
      const isMember = await this.supabaseService.isTripMember(tripId, userId);
      if (!isMember) {
        throw new BadRequestException('You are not a member of this trip.');
      }
    } else {
      if (tripId) {
        throw new BadRequestException(
          'trip_id must be omitted when scope is "global".',
        );
      }
    }

    const session = (await this.supabaseService.createAiSession({
      user_id: userId,
      trip_id: tripId,
      scope,
      model_name: 'z-ai/glm-5',
    })) as AiSessionRow;

    // Do not call the model here: it blocked "New chat" on OpenRouter latency for every session.
    // The first real user message still runs the full assistant + JSON pipeline.
    const welcome_message =
      scope === 'trip'
        ? "Hi! I'm here to help with this trip — route, dates, stops, or activities. What would you like to work on?"
        : "Hi! I'm your trip planning assistant. Tell me where you're headed (or what's on your mind) and we'll plan from there.";

    if (welcome_message.trim()) {
      await this.supabaseService.insertAiMessage(session.id, 'assistant', {
        text: welcome_message.trim(),
      });
    }

    return {
      session_id: session.id,
      session,
      welcome_message,
    };
  }

  async postMessage(
    userId: string,
    sessionId: string,
    dto: PostMessageDto,
    onProgress?: (event: AiMessageProgressEvent) => void,
  ): Promise<PostMessageResult> {
    const startTime = Date.now();
    this.logger.log(`Handling message for session ${sessionId} from user ${userId}`);

    const { data: session, error } = await this.supabaseService.getAiSession(
      sessionId,
      userId,
    );
    if (error || !session) {
      throw new NotFoundException('Session not found');
    }

    if (!this.openRouter.isConfigured()) {
      throw new BadRequestException(
        'AI is not configured. Set OPENROUTER_API_KEY.',
      );
    }

    const aiLimit = await this.supabaseService.checkUserAiLimit(userId);
    if (!aiLimit.allowed) {
      throw new BadRequestException({
        code: 'AI_TOKEN_LIMIT_REACHED',
        message: 'You have reached your AI token limit for this month.',
        used: aiLimit.used,
        limit: aiLimit.limit,
      });
    }

    const slots = (session.slots as Record<string, unknown>) ?? {};
    const summary = session.summary ?? '';
    const tripId = session.trip_id as string | null;

    let systemPrompt = this.buildSystemPrompt(session.scope, tripId, summary, slots);

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    try {
      const recentMessages = await this.supabaseService.getAiMessages(
        sessionId,
        10,
      );
      for (const m of recentMessages) {
        const c = m.content as Record<string, unknown>;
        if (m.role === 'user' && c?.text) {
          messages.push({ role: 'user', content: String(c.text) });
        } else if (m.role === 'assistant' && c?.text) {
          messages.push({ role: 'assistant', content: String(c.text) });
        }
      }
    } catch {
      // Ignore if no messages yet
    }

    const isFirstUserMessage = !session.summary?.trim();
    if (isFirstUserMessage) {
      systemPrompt += `\n\nThis is the first message in this chat. In your JSON response, include "chat_title" with a 3–4 word phrase that names the thread (e.g. "Weekend in Paris"). Do not use a separate TITLE: line.`;
      messages[0] = { role: 'system', content: systemPrompt };
    }

    let userContent = dto.message;
    if (dto.message === 'create_trip') {
      userContent =
        'User chose: Create a trip. Start the trip creation walkthrough using createTripDraft, then guide through title, dates, and route stops.';
    } else if (dto.message.startsWith('create_trip:')) {
      const extra = dto.message.slice('create_trip:'.length).trim();
      userContent =
        'User chose: Create a trip. Start the trip creation walkthrough using createTripDraft, then guide through title, dates, and route stops.' +
        (extra ? ` They also said: ${extra}` : '');
    } else if (dto.message === 'just_chat') {
      userContent =
        'User chose: Just chat. Continue the conversation without creating a trip.';
    } else if (dto.message.startsWith('just_chat:')) {
      const extra = dto.message.slice('just_chat:'.length).trim();
      userContent =
        'User chose: Just chat. Continue the conversation without creating a trip.' +
        (extra ? ` They also said: ${extra}` : '');
    } else if (dto.message === 'find_images') {
      userContent =
        'User chose: Find images. They want to browse Unsplash photos for inspiration. Acknowledge and ask what they\'d like to search for (e.g. a destination, vibe, or theme), or suggest they use the + menu to search.';
    } else if (dto.message.startsWith('find_images:')) {
      const extra = dto.message.slice('find_images:'.length).trim();
      userContent =
        'User chose: Find images. They want to browse Unsplash photos for inspiration.' +
        (extra ? ` They said: ${extra}` : ' Ask what they\'d like to search for.');
    }

    // Store only user-visible text in chat history. No raw action (just_chat, create_trip, find_images).
    // When the user sends only an action (no typed message), show the tool label so they see they selected a tool.
    const userDisplayText =
      dto.message === 'just_chat'
        ? 'Just chat'
        : dto.message.startsWith('just_chat:')
          ? dto.message.slice('just_chat:'.length).trim() || 'Just chat'
          : dto.message === 'create_trip'
            ? 'Create a trip'
            : dto.message.startsWith('create_trip:')
              ? dto.message.slice('create_trip:'.length).trim() || 'Create a trip'
              : dto.message === 'find_images'
                ? 'Find images'
                : dto.message.startsWith('find_images:')
                  ? dto.message.slice('find_images:'.length).trim() || 'Find images'
                  : dto.message;

    messages.push({ role: 'user', content: userContent });

    onProgress?.({ type: 'phase', phase: 'thinking' });

    const MAX_TOOL_LOOPS = 5;
    let finalContent = '';
    let quickReplies: Array<{ label: string; action: string }> | undefined;
    let slotsChanged = false;
    let imageSuggestions:
      | Array<{
          id: string;
          thumbnail_url: string;
          blur_hash: string | null;
          photographer_name: string;
          photographer_url: string;
        }>
      | undefined;
    let placeSuggestions:
      | Array<{
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
        }>
      | undefined;

    type PendingCoverImage = {
      unsplash_photo_id: string;
      download_location: string;
      image_url: string;
      photographer_name: string;
      photographer_url: string;
      blur_hash: string | null;
      dominant_color: string | null;
    };
    let pendingCoverImagesForSlots: PendingCoverImage[] | undefined;
    const executedToolNames: string[] = [];
    let budgetSummary:
      | {
          currency: string;
          per_person_estimate: number;
          assumptions?: string[];
        }
      | undefined;

    try {
      let currentMessages = messages;
      let lastResponseContent = '';
      let totalTokensUsed = 0;

      for (let i = 0; i < MAX_TOOL_LOOPS; i += 1) {
        onProgress?.({ type: 'phase', phase: 'model' });
        const response = await this.openRouter.chat({
          messages: currentMessages,
          tools: AI_TOOLS,
          tool_choice: 'auto',
          max_tokens: 2048,
        });

        lastResponseContent = response.content?.trim() ?? '';
        totalTokensUsed += response.usage?.total_tokens ?? 0;

        const toolCalls = response.tool_calls ?? [];
        if (!toolCalls.length) {
          break;
        }

        onProgress?.({ type: 'phase', phase: 'tools' });

        for (const toolCall of toolCalls) {
          const { name, arguments: argsJson } = toolCall.function;
          let parsedArgs: unknown;
          try {
            parsedArgs = JSON.parse(argsJson);
          } catch (err) {
            this.logger.warn(
              `Failed to parse tool arguments for ${name}: ${(err as Error).message}`,
            );
            continue;
          }

          onProgress?.({ type: 'tool', phase: 'start', name });
          executedToolNames.push(name);

          let result: unknown;
          try {
            result = await this.toolExecutor.execute(name, parsedArgs, userId);
          } catch (err) {
            this.logger.error(
              `Error executing tool ${name} for session ${sessionId}:`,
              err,
            );
            result = {
              error: (err as Error).message ?? 'Tool execution failed',
            };
          }

          onProgress?.({ type: 'tool', phase: 'done', name });

          if (name === 'createTripDraft' && result && typeof result === 'object') {
            const r = result as {
              trip_id?: string;
              share_code?: string;
            };
            if (r.trip_id) {
              (slots as Record<string, unknown>).current_trip_id = r.trip_id;
              if (r.share_code) {
                (slots as Record<string, unknown>).current_trip_share_code =
                  r.share_code;
              }
              slotsChanged = true;
            }
          }

          if (pendingCoverImagesForSlots && pendingCoverImagesForSlots.length > 0) {
            (slots as Record<string, unknown>).pending_cover_images =
              pendingCoverImagesForSlots;
            slotsChanged = true;
          }

          if (name === 'searchCoverImage' && result && typeof result === 'object') {
            const data = result as {
              results?: Array<{
                id?: string;
                blur_hash?: string | null;
                color?: string | null;
                urls?: { small?: string; regular?: string };
                links?: { download_location?: string };
                user?: { name?: string; links?: { html?: string } };
              }>;
            };
            const photos = Array.isArray(data.results) ? data.results : [];
            imageSuggestions = photos.slice(0, 6).map((photo) => ({
              id: String(photo.id ?? ''),
              thumbnail_url: String(
                photo.urls?.small ?? photo.urls?.regular ?? '',
              ),
              blur_hash:
                photo.blur_hash != null ? String(photo.blur_hash) : null,
              photographer_name: String(photo.user?.name ?? ''),
              photographer_url: String(photo.user?.links?.html ?? ''),
            }));
            // Cache for this turn so UI and agent use the same set; also stored in slots below
            pendingCoverImagesForSlots = photos.slice(0, 6).map((photo) => ({
              unsplash_photo_id: String(photo.id ?? ''),
              download_location: String(photo.links?.download_location ?? ''),
              image_url: String(photo.urls?.regular ?? photo.urls?.small ?? ''),
              photographer_name: String(photo.user?.name ?? ''),
              photographer_url: String(photo.user?.links?.html ?? ''),
              blur_hash: photo.blur_hash != null ? String(photo.blur_hash) : null,
              dominant_color: photo.color != null ? String(photo.color) : null,
            }));
            // Must persist in the same turn: the generic flush below only runs at the
            // *start* of the next tool iteration, so a lone searchCoverImage never
            // reached the DB and select-cover-image saw empty pending_cover_images.
            (slots as Record<string, unknown>).pending_cover_images =
              pendingCoverImagesForSlots;
            slotsChanged = true;
          }

          if (name === 'selectCoverImage' && result && typeof result === 'object') {
            const r = result as { success?: boolean };
            if (r.success) {
              (slots as Record<string, unknown>).pending_cover_images = undefined;
              pendingCoverImagesForSlots = undefined;
              slotsChanged = true;
            }
          }

          await this.supabaseService.insertAiMessage(sessionId, 'tool', {
            name,
            tool_call_id: toolCall.id,
            result,
          });

          currentMessages.push({
            role: 'tool',
            name,
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
      }

      finalContent = lastResponseContent;

      if (!finalContent) {
        this.logger.warn(
          `Empty AI response content for session ${sessionId}. Returning empty string to client.`,
        );
      }

      onProgress?.({ type: 'phase', phase: 'reply' });

      const MAX_JSON_CORRECTIONS = 2;
      if (finalContent.trim().length > 0) {
        for (let c = 0; c < MAX_JSON_CORRECTIONS; c += 1) {
          const candidate = finalContent.trim();
          if (this.parseAssistantJsonEnvelope(candidate) != null) {
            break;
          }
          this.logger.warn(
            `Assistant reply is not a valid JSON envelope (session ${sessionId}, correction ${c + 1}/${MAX_JSON_CORRECTIONS}); re-prompting model.`,
          );
          onProgress?.({ type: 'phase', phase: 'formatting' });
          currentMessages.push({
            role: 'assistant',
            content: candidate,
          });
          currentMessages.push({
            role: 'user',
            content: this.buildJsonFormatCorrectionPrompt(candidate),
          });
          const fixResponse = await this.openRouter.chat({
            messages: currentMessages,
            max_tokens: 2048,
            temperature: 0.35,
          });
          totalTokensUsed += fixResponse.usage?.total_tokens ?? 0;
          finalContent = fixResponse.content?.trim() ?? '';
          if (!finalContent.trim()) {
            this.logger.warn(
              `Empty reformatted AI response for session ${sessionId} after JSON correction.`,
            );
            break;
          }
        }
        const stillInvalid =
          finalContent.trim().length > 0 &&
          this.parseAssistantJsonEnvelope(finalContent.trim()) == null;
        if (stillInvalid) {
          this.logger.warn(
            `Assistant reply still not a valid JSON envelope after ${MAX_JSON_CORRECTIONS} correction(s); continuing with legacy parsers (session ${sessionId}).`,
          );
        }
      }

      const envelopeParsed = this.parseAssistantJsonEnvelope(finalContent);
      if (envelopeParsed) {
        finalContent = envelopeParsed.message;
        if (envelopeParsed.quick_replies?.length) {
          quickReplies = envelopeParsed.quick_replies;
        }
      } else {
        const quickParsed = this.parseQuickRepliesFromResponse(finalContent);
        if (quickParsed) {
          finalContent = quickParsed.content;
          quickReplies = quickParsed.quick_replies;
        }
      }
      if (!quickReplies) {
        const quickParsed2 = this.parseQuickRepliesFromResponse(finalContent);
        if (quickParsed2) {
          finalContent = quickParsed2.content;
          quickReplies = quickParsed2.quick_replies;
        }
      }

      let sessionSummary: string | null = null;
      if (isFirstUserMessage) {
        if (envelopeParsed?.chat_title) {
          sessionSummary = envelopeParsed.chat_title;
        } else {
          const parsed = this.parseTitleFromResponse(finalContent);
          if (parsed) {
            sessionSummary = parsed.title;
            finalContent = parsed.content;
          }
        }
        const titleStrip = this.parseTitleFromResponse(finalContent);
        if (titleStrip) {
          finalContent = titleStrip.content;
          if (!sessionSummary) sessionSummary = titleStrip.title;
        }
        if (!sessionSummary) {
          const words = userDisplayText.trim().split(/\s+/).slice(0, 4);
          sessionSummary = words.length ? words.join(' ') : null;
        }
      }

      const placeParsed = this.parsePlaceCardsFromResponse(finalContent);
      if (placeParsed) {
        finalContent = placeParsed.content;
        placeSuggestions = placeParsed.place_suggestions;
      }

      const budgetParsed = this.parseBudgetSummaryFromResponse(finalContent);
      if (budgetParsed) {
        finalContent = budgetParsed.content;
        budgetSummary = budgetParsed.budget_summary;
      }

      const linkedTripIdRaw = (slots as Record<string, unknown>).current_trip_id;
      const linkedTripId =
        typeof linkedTripIdRaw === 'string' && linkedTripIdRaw.trim().length > 0
          ? linkedTripIdRaw.trim()
          : undefined;

      await this.supabaseService.insertAiMessage(sessionId, 'user', {
        text: userDisplayText,
      });
      if (isFirstUserMessage && sessionSummary) {
        await this.supabaseService.updateAiSession(sessionId, userId, {
          summary: sessionSummary,
        });
      }
      if (slotsChanged) {
        await this.supabaseService.updateAiSession(sessionId, userId, {
          slots,
        });
      }
      await this.supabaseService.insertAiMessage(sessionId, 'assistant', {
        text: finalContent,
        ...(quickReplies ? { quick_replies: quickReplies } : {}),
        ...(imageSuggestions ? { image_suggestions: imageSuggestions } : {}),
        ...(placeSuggestions ? { place_suggestions: placeSuggestions } : {}),
        ...(linkedTripId ? { linked_trip_id: linkedTripId } : {}),
        ...(executedToolNames.length > 0
          ? { tool_calls: executedToolNames }
          : {}),
        ...(budgetSummary ? { budget_summary: budgetSummary } : {}),
      });

      let usage: { used: number; limit: number | null; percent: number | null } | undefined;
      if (totalTokensUsed > 0) {
        const row = await this.supabaseService.updateUserAiUsage(userId, totalTokensUsed);
        const limit = row.ai_token_monthly_limit ?? null;
        const used = row.ai_tokens_used_month ?? 0;
        usage = {
          used,
          limit,
          percent:
            limit != null && limit > 0
              ? Math.min(100, Math.round((used / limit) * 100))
              : null,
        };
      }

      const latency = Date.now() - startTime;
      this.logger.log(
        `Generated response for session ${sessionId} in ${latency}ms using ${totalTokensUsed} tokens`,
      );

      return {
        message: finalContent,
        ...(linkedTripId ? { linked_trip_id: linkedTripId } : {}),
        quick_replies: quickReplies,
        image_suggestions: imageSuggestions,
        place_suggestions: placeSuggestions,
        ...(executedToolNames.length > 0
          ? { tool_calls: executedToolNames }
          : {}),
        ...(budgetSummary ? { budget_summary: budgetSummary } : {}),
        ...(usage ? { usage } : {}),
      };
    } catch (err) {
      this.logger.error(`Error generating response for session ${sessionId}:`, err);
      throw err;
    }
  }

  private isPlainRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private buildJsonFormatCorrectionPrompt(invalidAssistantOutput: string): string {
    const maxLen = 3800;
    const clipped =
      invalidAssistantOutput.length > maxLen
        ? `${invalidAssistantOutput.slice(0, maxLen)}\n… (truncated)`
        : invalidAssistantOutput;
    return (
      'Your last reply did not follow the required output format. Respond with ONLY one JSON object (valid JSON, no markdown fences, no text before or after the object). ' +
      'Schema: {"message":"<string, markdown allowed inside>","quick_replies":[{"label":"<string>","action":"<string>"}],"chat_title":"<optional 3-4 words; first reply in a new chat only>"}. ' +
      '"message" is required and must be non-empty. ' +
      'quick_replies is optional; put tappable choices there, not only as numbered lists inside message. ' +
      'Inside message you may end with a line PLACE_CARDS: [...] for place cards (prefer real venues with accurate place_id and coordinates when known) and/or BUDGET_SUMMARY: {...} for per-person budget. ' +
      'Keep the same meaning and itinerary as before, but output only valid JSON in that shape. ' +
      'Previous invalid output:\n' +
      clipped
    );
  }

  /**
   * Parses a JSON-only assistant envelope: { message, quick_replies?, chat_title? }.
   * Fallback for older chats: returns null.
   */
  private parseAssistantJsonEnvelope(content: string): {
    message: string;
    quick_replies?: Array<{ label: string; action: string }>;
    chat_title?: string;
  } | null {
    const tryParseRecord = (raw: string): Record<string, unknown> | null => {
      try {
        const v: unknown = JSON.parse(raw);
        return this.isPlainRecord(v) ? v : null;
      } catch {
        return null;
      }
    };

    const trimmed = content.trim();
    let rec = tryParseRecord(trimmed);
    if (!rec) {
      const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      if (fence) rec = tryParseRecord(fence[1].trim());
    }
    if (!rec) {
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start >= 0 && end > start) {
        rec = tryParseRecord(trimmed.slice(start, end + 1));
      }
    }
    if (!rec) return null;

    const messageVal = rec.message;
    if (typeof messageVal !== 'string') return null;

    let quick_replies: Array<{ label: string; action: string }> | undefined;
    const qrRaw = rec.quick_replies;
    if (Array.isArray(qrRaw)) {
      const parsed: Array<{ label: string; action: string }> = [];
      for (const item of qrRaw) {
        if (!this.isPlainRecord(item)) continue;
        const label =
          typeof item.label === 'string' ? item.label.trim() : '';
        const action =
          typeof item.action === 'string' ? item.action.trim() : '';
        if (label.length > 0 && action.length > 0) {
          parsed.push({ label, action });
        }
      }
      if (parsed.length > 0) quick_replies = parsed;
    }

    let chat_title: string | undefined;
    const titleRaw = rec.chat_title;
    if (typeof titleRaw === 'string' && titleRaw.trim().length > 0) {
      chat_title = titleRaw.trim().split(/\s+/).slice(0, 4).join(' ');
    }

    const message = messageVal.trim();
    if (!message) return null;

    return {
      message,
      ...(quick_replies ? { quick_replies } : {}),
      ...(chat_title ? { chat_title } : {}),
    };
  }

  /**
   * Parses "TITLE: <phrase>" from the end of the AI response (first message only).
   * Returns { title, content } with the TITLE line stripped, or null if not found.
   */
  private parseTitleFromResponse(
    content: string,
  ): { title: string; content: string } | null {
    const lines = content.split('\n');
    let titleLineIndex = -1;
    let titleValue = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const match = line.match(/^TITLE:\s*(.+)$/i);
      if (match) {
        titleLineIndex = i;
        titleValue = match[1].trim().split(/\s+/).slice(0, 4).join(' ');
        break;
      }
    }
    if (titleLineIndex < 0 || !titleValue) return null;
    const newLines = lines.filter((_, i) => i !== titleLineIndex);
    const newContent = newLines.join('\n').trim();
    return { title: titleValue, content: newContent };
  }

  private parseQuickRepliesFromResponse(
    content: string,
  ): { content: string; quick_replies: Array<{ label: string; action: string }> } | null {
    const lines = content.split('\n');
    let qrLineIndex = -1;
    let rawJson = '';

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i];
      const match = line.match(/^QUICK_REPLIES:\s*(\[.+\])\s*$/i);
      if (match) {
        qrLineIndex = i;
        rawJson = match[1];
        break;
      }
    }

    if (qrLineIndex < 0 || !rawJson) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawJson) as Array<{
        label?: string;
        action?: string;
      }>;
      const quick_replies = parsed
        .map((qr) => ({
          label: String(qr.label ?? '').trim(),
          action: String(qr.action ?? '').trim(),
        }))
        .filter((qr) => qr.label && qr.action);

      const newLines = lines.filter((_, i) => i !== qrLineIndex);
      const newContent = newLines.join('\n').trim();

      return quick_replies.length
        ? { content: newContent, quick_replies }
        : null;
    } catch (err) {
      this.logger.warn(
        `Failed to parse QUICK_REPLIES JSON: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private parsePlaceCardsFromResponse(
    content: string,
  ): {
    content: string;
    place_suggestions: Array<{
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
    }>;
  } | null {
    const lines = content.split('\n');
    let placesLineIndex = -1;
    let rawJson = '';

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i];
      const match = line.match(/^PLACE_CARDS:\s*(\[.+\])\s*$/i);
      if (match) {
        placesLineIndex = i;
        rawJson = match[1];
        break;
      }
    }

    if (placesLineIndex < 0 || !rawJson) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawJson) as Array<Record<string, unknown>>;
      const suggestions = parsed
        .map((item) => {
          const nameValue = item?.name;
          if (typeof nameValue !== 'string' || !nameValue.trim()) return null;

          const normalizeNumber = (value: unknown): number | null =>
            typeof value === 'number' && Number.isFinite(value) ? value : null;
          const normalizeString = (value: unknown): string | null =>
            typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
          const hoursValue = item?.weekday_hours;
          const weekdayHours =
            Array.isArray(hoursValue)
              ? hoursValue
                  .filter((value) => typeof value === 'string' && value.trim().length > 0)
                  .map((value) => String(value))
              : [];

          return {
            name: nameValue.trim(),
            address: normalizeString(item?.address),
            latitude: normalizeNumber(item?.latitude),
            longitude: normalizeNumber(item?.longitude),
            rating: normalizeNumber(item?.rating),
            rating_count: normalizeNumber(item?.rating_count),
            place_type: normalizeString(item?.place_type),
            place_id: normalizeString(item?.place_id),
            photo_url: normalizeString(item?.photo_url),
            phone_number: normalizeString(item?.phone_number),
            website: normalizeString(item?.website),
            weekday_hours: weekdayHours.length ? weekdayHours : null,
            visit_time: normalizeString(item?.visit_time),
            ai_note: normalizeString(item?.ai_note),
          };
        })
        .filter((item) => item != null);

      if (!suggestions.length) return null;

      const newLines = lines.filter((_, i) => i !== placesLineIndex);
      return {
        content: newLines.join('\n').trim(),
        place_suggestions: suggestions,
      };
    } catch (err) {
      this.logger.warn(`Failed to parse PLACE_CARDS JSON: ${(err as Error).message}`);
      return null;
    }
  }

  private parseBudgetSummaryFromResponse(
    content: string,
  ):
    | {
        content: string;
        budget_summary: {
          currency: string;
          per_person_estimate: number;
          assumptions?: string[];
        };
      }
    | null {
    const lines = content.split('\n');
    let budgetLineIndex = -1;
    let rawJson = '';

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i];
      const match = line.match(/^BUDGET_SUMMARY:\s*(\{.+\})\s*$/i);
      if (match) {
        budgetLineIndex = i;
        rawJson = match[1];
        break;
      }
    }

    if (budgetLineIndex < 0 || !rawJson) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(rawJson);
      if (!this.isPlainRecord(parsed)) {
        return null;
      }
      const rec = parsed;
      const currencyRaw = rec.currency;
      const estimateRaw = rec.per_person_estimate;
      const assumptionsRaw = rec.assumptions;

      if (typeof currencyRaw !== 'string' || !currencyRaw.trim()) {
        return null;
      }
      if (typeof estimateRaw !== 'number' || !Number.isFinite(estimateRaw)) {
        return null;
      }

      let assumptions: string[] | undefined;
      if (Array.isArray(assumptionsRaw)) {
        const linesOut = assumptionsRaw
          .filter((a) => typeof a === 'string' && a.trim().length > 0)
          .map((a) => String(a).trim());
        if (linesOut.length > 0) assumptions = linesOut;
      }

      const newLines = lines.filter((_, i) => i !== budgetLineIndex);
      return {
        content: newLines.join('\n').trim(),
        budget_summary: {
          currency: currencyRaw.trim().toUpperCase(),
          per_person_estimate: estimateRaw,
          ...(assumptions ? { assumptions } : {}),
        },
      };
    } catch (err) {
      this.logger.warn(
        `Failed to parse BUDGET_SUMMARY JSON: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private buildSystemPrompt(
    scope: string,
    tripId: string | null,
    summary: string,
    slots: Record<string, unknown>,
  ): string {
    let prompt = `You are a helpful trip planning assistant for gotrippin. You help users plan trips, suggest destinations, and give travel advice. Keep responses concise and friendly.`;

    prompt += `\n\nWhen the user first expresses interest in going somewhere or planning a trip (and has not yet chosen a mode), reply briefly and warmly in JSON, and set quick_replies to include at least {\"label\":\"Create a trip\",\"action\":\"create_trip\"} and {\"label\":\"Just chat\",\"action\":\"just_chat\"}.`;
    prompt += `\n\nOnce the user has already chosen "Just chat", do NOT keep offering both "Create a trip" and "Just chat" in quick_replies. Instead, offer only context-relevant options. When they are asking for inspiration, destinations to visit, or photos/pictures, include Find images in quick_replies: {\"label\":\"Find images\",\"action\":\"find_images\"}. When in "just chat" and they want inspiration or locations, prefer quick_replies such as Find images and Create a trip rather than repeating "Just chat".`;
    prompt += `\n\nWhen you receive a user message that is exactly "create_trip", treat it as: "User chose: Create a trip. Start the trip creation walkthrough using tools (createTripDraft, updateTrip, addLocation, getRoute, etc.), asking for missing details like title, dates, and route stops, and confirming with the user as you go."\nWhen you receive a user message that is exactly "just_chat", treat it as: "User chose: Just chat. Continue the conversation without creating or modifying any trips."\nWhen you receive "find_images" or "find_images: ...", treat it as: User chose Find images; acknowledge and help them search for photos (they can use the + menu; you can suggest a search query).`;

    prompt += `\n\nOUTPUT FORMAT (required for every visible assistant reply after tools finish): respond with a single JSON object only — no text before or after the JSON, no markdown code fences around the whole reply. The object must include:\n- "message" (string, required): markdown for the user (headings, bold, lists, emojis allowed inside the string).\n- "quick_replies" (optional array): when you offer follow-up choices, use objects {"label":"<short UI label>","action":"<string>"}. Use actions: "create_trip", "find_images", "just_chat", or "just_chat:<concise intent>" so the app forwards the user intent (e.g. "just_chat:Adjust the route order or swap cities"). Include quick_replies whenever you list options the user can tap — do not rely only on numbered lists in message for tap targets.\n- "chat_title" (optional string, 3–4 words): include only on the first assistant message in a brand-new chat to name the thread; omit on later turns.\nInside "message", you may still end with optional machine-readable lines on their own lines: PLACE_CARDS: [...] (valid JSON array) and/or BUDGET_SUMMARY: {...} (valid JSON object), same rules as below. Do not duplicate QUICK_REPLIES: or TITLE: lines inside message when you already use JSON keys.`;

    prompt += `\n\nWhen asking follow-up questions inside "message", you may still use numbered lists for readability, but the tappable choices must appear in quick_replies.`;

    prompt += `\n\nWhen the user describes a specific new trip in natural language (for example: "I wanna go on a trip to Bali on the 14th of March"), you must:\n- Extract what you can (destination, approximate dates, preferences) from their message.\n- Ask follow-up questions only for missing key information, one at a time (for example: \"How many days do you want to stay?\" if you know the start date but not the duration or end date).\n- Once you know at least a destination and a start and end date (or a start date and duration that implies the end date), use the tools to:\n  - Create or update a real trip via createTripDraft and updateTrip.\n  - Then call searchCoverImage with an appropriate query (for example: \"Bali travel landscape\"), and describe a few of the returned image options in your reply so the user can pick one.\n- Cover selection: the app shows images in a tappable gallery. When the user taps there, the client saves the cover and posts the choice to the chat — you must NOT ask them to type \"use image 6\" or similar, and do NOT add quick_replies that only repeat that. If they instead describe a choice only in text (e.g. \"the sunset one\", \"number 3\"), call selectCoverImage with the matching object from pending_cover_images.`;
    prompt += `\n\nWhen you suggest a day plan with concrete places, include a machine-readable line at the end of your response: PLACE_CARDS: [ ... ]. This line must be valid JSON on one line and include 2-8 places. Each entry must be a real Google Maps **Place** (a venue users can open in Google Maps with reviews, photos, and contact info)—not a made-up label with random latitude/longitude dropped on the map (that only shows a bare coordinate pin and breaks the in-app experience). Therefore every object in PLACE_CARDS **must** include a truthful **place_id** (Google Places id, e.g. ChIJ… or the canonical places/… id) that corresponds to that exact venue name. **latitude** and **longitude** must be the official coordinates for that same place_id (same source of truth); never invent coordinates. If you cannot confidently supply a correct place_id for a stop, omit that stop or replace it with a different well-known venue you can verify—do not emit PLACE_CARDS rows without place_id. Also include when known: name (required), address, rating, rating_count, place_type, photo_url, phone_number, website, weekday_hours (array), visit_time (e.g. \"9:00 AM\"), ai_note (2–4 sentences per stop: practical, specific—vibe, typical price band or value, opening days or best time, one budget tip when useful; like a concise travel tip, not generic filler); set rating, rating_count, and photo_url to null if unknown so the client may enrich from Google when place_id is present. Keep your normal human-readable reply above this line. Do not mention the PLACE_CARDS line in visible text.`;
    prompt += `\n\nWhen you give a costed itinerary or budget guidance, add a final line after PLACE_CARDS (if any): BUDGET_SUMMARY: {\"currency\":\"EUR\",\"per_person_estimate\":<number>,\"assumptions\":[\"optional short bullet strings\"]}. Use a realistic rough total per person for transport+lodging+food+activities for the trip length; state assumptions in the array. One line only; valid JSON object. Do not mention BUDGET_SUMMARY in the visible prose.`;

    prompt += `\n\nTrip route (saved map / itinerary) vs PLACE_CARDS: PLACE_CARDS is only for the in-chat itinerary UI (venues with place_id). It does NOT add stops to the user's saved trip. Once you have a trip_id (from createTripDraft or session context), you must build the real route with tools: call addLocation once per agreed stop (use clear names like "Sofia, Bulgaria", "Plovdiv, Bulgaria"), in visit order, then call getRoute to verify the ordered list. When the user confirms two or more cities or stops, do this in the same turn batch if possible—do not stop after cover images or PLACE_CARDS alone. If they only want ideas without saving, stay in just_chat and skip addLocation.`;
    prompt += `\n\nWhen the user sends a short intent to work on the saved route (e.g. "Add stops to my trip") and Current context includes current_trip_id, treat that as a request to use addLocation and getRoute with that trip_id—ask which places if none are named yet.`;

    if (scope === 'trip' && tripId) {
      prompt += `\n\nThe user is working on a specific trip (trip_id: ${tripId}).`;
    }

    const pendingCover = slots.pending_cover_images as
      | Array<{
          unsplash_photo_id: string;
          download_location: string;
          image_url: string;
          photographer_name: string;
          photographer_url: string;
          blur_hash?: string | null;
          dominant_color?: string | null;
        }>
      | undefined;
    if (
      Array.isArray(pendingCover) &&
      pendingCover.length > 0
    ) {
      prompt += `\n\nThe user may be choosing a cover from the gallery in the app (tap saves directly; no chat message needed). If they only send text describing which photo, call selectCoverImage with that photo's data from this exact list. Do NOT call searchCoverImage again until they have picked one or asked for different images.`;
      prompt += `\n\nPending cover images (use these exact objects for selectCoverImage; position 1 = first image): ${JSON.stringify(pendingCover)}`;
    }

    if (summary) {
      prompt += `\n\nConversation summary: ${summary}`;
    }
    if (Object.keys(slots).length > 0) {
      prompt += `\n\nCurrent context: ${JSON.stringify(slots)}`;
    }

    return prompt;
  }
}
