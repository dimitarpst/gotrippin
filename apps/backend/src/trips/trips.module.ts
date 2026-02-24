import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { ImagesModule } from '../images/images.module';
import { TripLocationsModule } from '../trip-locations/trip-locations.module';
import { ActivitiesModule } from '../activities/activities.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [
    SupabaseModule,
    AuthModule,
    ImagesModule,
    TripLocationsModule,
    ActivitiesModule,
    WeatherModule,
  ],
  providers: [TripsService],
  controllers: [TripsController],
})
export class TripsModule {}
