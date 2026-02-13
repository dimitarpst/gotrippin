import { IsString, IsOptional, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for getting weather timeline (forecast)
 */
export class GetWeatherTimelineDto {
  @ApiProperty({
    required: true,
    example: 'Tokyo',
    description: 'Location (city name or coordinates "lat,lon")',
  })
  @IsString()
  location: string;

  @ApiProperty({
    required: false,
    example: '2026-02-11T00:00:00Z',
    description: 'Start date for forecast (ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ, e.g., 2026-02-11T00:00:00Z)',
  })
  @IsOptional()
  @IsISO8601(
    {},
    {
      message:
        'Start date must be a valid ISO 8601 date in format YYYY-MM-DDTHH:mm:ssZ (e.g., 2024-12-01T00:00:00Z)',
    },
  )
  startDate?: string;

  @ApiProperty({
    required: false,
    example: '2026-02-17T23:59:59Z',
    description: 'End date for forecast (ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ, e.g., 2026-02-17T23:59:59Z)',
  })
  @IsOptional()
  @IsISO8601(
    {},
    {
      message:
        'End date must be a valid ISO 8601 date in format YYYY-MM-DDTHH:mm:ssZ (e.g., 2024-12-07T23:59:59Z)',
    },
  )
  endDate?: string;
}

