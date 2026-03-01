import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { TripsModule } from '../trips/trips.module';
import { TripLocationsModule } from '../trip-locations/trip-locations.module';
import { OpenRouterClient } from './openrouter.client';
import { ToolExecutor } from './tools/tool-executor';

@Module({
  imports: [
    AuthModule,
    SupabaseModule,
    TripsModule,
    TripLocationsModule,
  ],
  providers: [AiService, OpenRouterClient, ToolExecutor],
  controllers: [AiController],
})
export class AiModule {}
