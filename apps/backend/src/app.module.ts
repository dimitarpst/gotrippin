import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { TripsModule } from "./trips/trips.module";
import { TripLocationsModule } from "./trip-locations/trip-locations.module";
import { ActivitiesModule } from "./activities/activities.module";
import { TripExpensesModule } from "./trip-expenses/trip-expenses.module";
import { AiModule } from "./ai/ai.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { ImagesModule } from "./images/images.module";
import { WeatherModule } from "./weather/weather.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    SupabaseModule,
    AuthModule,
    ProfilesModule,
    TripsModule,
    TripLocationsModule,
    ActivitiesModule,
    TripExpensesModule,
    AiModule,
    ImagesModule,
    WeatherModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
