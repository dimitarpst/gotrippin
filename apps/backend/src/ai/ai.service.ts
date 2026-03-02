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
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly openRouter: OpenRouterClient,
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
        return { role: m.role as 'user' | 'assistant', content: text };
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

    messages.push({ role: 'user', content: dto.message });

    // Single request per message (no tools/agent loop) to stay within rate limits.
    try {
      const response = await this.openRouter.chat({
        messages,
        max_tokens: 1024,
      });

      let finalContent = response.content?.trim() ?? '';

      if (!finalContent) {
        this.logger.warn(
          `Empty AI response content for session ${sessionId}. Returning empty string to client.`,
        );
      }

      let sessionSummary: string | null = null;
      if (isFirstUserMessage) {
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
      await this.supabaseService.insertAiMessage(sessionId, 'assistant', {
        text: finalContent,
      });

      const latency = Date.now() - startTime;
      this.logger.log(`Generated response for session ${sessionId} in ${latency}ms`);

      return {
        message: finalContent,
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

  private buildSystemPrompt(
    scope: string,
    tripId: string | null,
    summary: string,
    slots: Record<string, unknown>,
  ): string {
    let prompt = `You are a helpful trip planning assistant for Go Trippin'. You help users plan trips, suggest destinations, and give travel advice. Keep responses concise and friendly.`;

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
