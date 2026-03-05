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

export interface PostMessageResult {
  message: string;
  quick_replies?: Array<{ label: string; action: string }>;
  image_suggestions?: Array<{
    id: string;
    thumbnail_url: string;
    blur_hash: string | null;
    photographer_name: string;
    photographer_url: string;
  }>;
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
        const text = c?.text != null ? String(c.text) : '';

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

        return {
          role: m.role as 'user' | 'assistant',
          content: text,
          ...(quick_replies ? { quick_replies } : {}),
          ...(image_suggestions ? { image_suggestions } : {}),
        };
      });
    return {
      session: {
        id: session.id,
        scope: session.scope,
        summary: session.summary,
        created_at: session.created_at,
        updated_at: session.updated_at,
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

    let welcome_message: string | undefined;

    if (this.openRouter.isConfigured()) {
      const systemPrompt =
        scope === 'trip'
          ? 'You are a helpful trip planning assistant. The user is editing a specific trip. Reply briefly in one or two sentences. Welcome them and offer to help plan the route, dates, or activities.'
          : 'You are a helpful trip planning assistant. Reply briefly in one or two sentences. Welcome the user and offer to help create or plan a trip.';

      try {
        const response = await this.openRouter.chat({
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: dto.initial_message ?? 'Hi, I want to plan a trip.',
            },
          ],
          max_tokens: 150,
        });
        welcome_message = response.content?.trim() || undefined;
      } catch (err) {
        console.error('[AiService] OpenRouter welcome message failed:', err);
        welcome_message =
          "Hi! I'm your trip planning assistant. How can I help you today?";
      }
    }

    if (welcome_message?.trim()) {
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
      systemPrompt += `\n\nThis is the first message in this chat. You must end your reply with a newline and then exactly one line in this format: TITLE: followed by a 3–4 word phrase that summarizes the conversation topic (e.g. TITLE: Weekend in Paris). The user will not see this line; it is used only as the chat title. Do not mention the TITLE line in your reply.`;
      messages[0] = { role: 'system', content: systemPrompt };
    }

    let userContent = dto.message;
    if (dto.message === 'create_trip') {
      userContent =
        'User chose: Create a trip. Start the trip creation walkthrough using createTripDraft, then guide through title, dates, and route stops.';
    } else if (dto.message === 'just_chat') {
      userContent =
        'User chose: Just chat. Continue the conversation without creating a trip.';
    }

    messages.push({ role: 'user', content: userContent });

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

    try {
      let currentMessages = messages;
      let lastResponseContent = '';

      for (let i = 0; i < MAX_TOOL_LOOPS; i += 1) {
        const response = await this.openRouter.chat({
          messages: currentMessages,
          tools: AI_TOOLS,
          tool_choice: 'auto',
          max_tokens: 1024,
        });

        lastResponseContent = response.content?.trim() ?? '';

        const toolCalls = response.tool_calls ?? [];
        if (!toolCalls.length) {
          break;
        }

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

          if (name === 'searchCoverImage' && result && typeof result === 'object') {
            const data = result as {
              results?: Array<{
                id?: string;
                blur_hash?: string | null;
                urls?: { small?: string; regular?: string };
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

      let sessionSummary: string | null = null;
      if (isFirstUserMessage) {
        const quickParsed = this.parseQuickRepliesFromResponse(finalContent);
        if (quickParsed) {
          finalContent = quickParsed.content;
          quickReplies = quickParsed.quick_replies;
        }

        const parsed = this.parseTitleFromResponse(finalContent);
        if (parsed) {
          sessionSummary = parsed.title;
          finalContent = parsed.content;
        }
        if (!sessionSummary) {
          const words = dto.message.trim().split(/\s+/).slice(0, 4);
          sessionSummary = words.length ? words.join(' ') : null;
        }
      }

      await this.supabaseService.insertAiMessage(sessionId, 'user', {
        text: dto.message,
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
      });

      const latency = Date.now() - startTime;
      this.logger.log(`Generated response for session ${sessionId} in ${latency}ms`);

      return {
        message: finalContent,
        quick_replies: quickReplies,
        image_suggestions: imageSuggestions,
      };
    } catch (err) {
      this.logger.error(`Error generating response for session ${sessionId}:`, err);
      throw err;
    }
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

  private buildSystemPrompt(
    scope: string,
    tripId: string | null,
    summary: string,
    slots: Record<string, unknown>,
  ): string {
    let prompt = `You are a helpful trip planning assistant for gotrippin. You help users plan trips, suggest destinations, and give travel advice. Keep responses concise and friendly.`;

    prompt += `\n\nWhen the user expresses interest in going somewhere or planning a trip (for example: "I want to go to Bali", "thinking about Japan", "I want to plan a vacation"), you should:\n- Reply briefly and warmly in 1–3 sentences.\n- At the end of your reply, on a new line, output exactly one line in this format (the user will not see it):\nQUICK_REPLIES: [{\"label\":\"Create a trip\",\"action\":\"create_trip\"},{\"label\":\"Just chat\",\"action\":\"just_chat\"}]\nDo not mention this QUICK_REPLIES line in your visible reply.`;

    prompt += `\n\nWhen you receive a user message that is exactly "create_trip", treat it as: "User chose: Create a trip. Start the trip creation walkthrough using tools (createTripDraft, updateTrip, addLocation, getRoute, etc.), asking for missing details like title, dates, and route stops, and confirming with the user as you go."\nWhen you receive a user message that is exactly "just_chat", treat it as: "User chose: Just chat. Continue the conversation without creating or modifying any trips."`;

    prompt += `\n\nWhen the user describes a specific new trip in natural language (for example: "I wanna go on a trip to Bali on the 14th of March"), you must:\n- Extract what you can (destination, approximate dates, preferences) from their message.\n- Ask follow-up questions only for missing key information, one at a time (for example: \"How many days do you want to stay?\" if you know the start date but not the duration or end date).\n- Once you know at least a destination and a start and end date (or a start date and duration that implies the end date), use the tools to:\n  - Create or update a real trip via createTripDraft and updateTrip.\n  - Then call searchCoverImage with an appropriate query (for example: \"Bali travel landscape\"), and describe a few of the returned image options in your reply so the user can pick one.\n- When the user clearly chooses an image (for example: \"use the second image\" or \"use the sunset beach photo\"), call selectCoverImage with the corresponding Unsplash photo metadata to set the trip cover. Confirm in your reply after the tool succeeds.`;

    if (scope === 'trip' && tripId) {
      prompt += `\n\nThe user is working on a specific trip (trip_id: ${tripId}).`;
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
