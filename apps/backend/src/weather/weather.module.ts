import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { TripWeatherController } from './trip-weather.controller';
import { TripLocationsModule } from '../trip-locations/trip-locations.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, TripLocationsModule, AuthModule],
  providers: [WeatherService],
  controllers: [WeatherController, TripWeatherController],
  exports: [WeatherService],
})
export class WeatherModule {}

