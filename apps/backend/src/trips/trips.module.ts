import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [SupabaseModule, AuthModule, ImagesModule],
  providers: [TripsService],
  controllers: [TripsController],
})
export class TripsModule {}
