import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for getting realtime weather
 */
export class GetRealtimeWeatherDto {
  @ApiProperty({
    required: true,
    example: 'Tokyo',
    description: 'Location (city name or coordinates "lat,lon")',
  })
  @IsString()
  location: string;
}

