import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { OpenRouterClient } from './openrouter.client';

@Module({
  imports: [AuthModule, SupabaseModule],
  providers: [AiService, OpenRouterClient],
  controllers: [AiController],
})
export class AiModule {}
