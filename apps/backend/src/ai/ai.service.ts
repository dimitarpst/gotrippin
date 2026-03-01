import {
  BadRequestException,
  Injectable,
  NotFoundException,
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
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly openRouter: OpenRouterClient,
  ) {}

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

    const systemPrompt = this.buildSystemPrompt(session.scope, tripId, summary, slots);

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

    messages.push({ role: 'user', content: dto.message });

    // Single request per message (no tools/agent loop) to stay within rate limits.
    const response = await this.openRouter.chat({
      messages,
      max_tokens: 1024,
    });

    const finalContent = response.content?.trim() ?? '';

    await this.supabaseService.insertAiMessage(sessionId, 'user', {
      text: dto.message,
    });
    await this.supabaseService.insertAiMessage(sessionId, 'assistant', {
      text: finalContent,
    });

    return {
      message: finalContent,
    };
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
