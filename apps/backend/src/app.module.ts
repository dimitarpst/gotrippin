import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { TripsModule } from './trips/trips.module';
import { TripLocationsModule } from './trip-locations/trip-locations.module';
import { ActivitiesModule } from './activities/activities.module';
import { AiModule } from './ai/ai.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ImagesModule } from './images/images.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    SupabaseModule,
    AuthModule,
    ProfilesModule,
    TripsModule,
    TripLocationsModule,
    ActivitiesModule,
    AiModule,
    ImagesModule,
    WeatherModule,
  ],
})
export class AppModule {}
