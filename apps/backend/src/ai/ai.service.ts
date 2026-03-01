import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenRouterClient } from './openrouter.client';
import { CreateSessionDto } from './dto/create-session.dto';

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

@Injectable()
export class AiService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly openRouter: OpenRouterClient,
  ) {}

  async createSession(userId: string, dto: CreateSessionDto): Promise<CreateSessionResult> {
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
        throw new BadRequestException('trip_id must be omitted when scope is "global".');
      }
    }

    const session = await this.supabaseService.createAiSession({
      user_id: userId,
      trip_id: tripId,
      scope,
      model_name: 'z-ai/glm-5',
    }) as AiSessionRow;

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
            { role: 'user', content: dto.initial_message ?? 'Hi, I want to plan a trip.' },
          ],
          max_tokens: 150,
        });
        welcome_message = response.content?.trim() || undefined;
      } catch (err) {
        console.error('[AiService] OpenRouter welcome message failed:', err);
        welcome_message = "Hi! I'm your trip planning assistant. How can I help you today?";
      }
    }

    return {
      session_id: session.id,
      session,
      welcome_message,
    };
  }
}
