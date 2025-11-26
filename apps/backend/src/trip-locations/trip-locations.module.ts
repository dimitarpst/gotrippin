import { Module } from '@nestjs/common';
import { TripLocationsService } from './trip-locations.service';
import { TripLocationsController } from './trip-locations.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  providers: [TripLocationsService],
  controllers: [TripLocationsController],
  exports: [TripLocationsService],
})
export class TripLocationsModule {}

