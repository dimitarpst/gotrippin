import { IsString, IsNumber, IsOptional, Min, Max, IsInt, IsPositive, IsDateString, Matches, ValidateIf, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTripLocationDto {
  @ApiPropertyOptional({
    description: 'If sent, update fails with 409 when this row changed since this timestamp',
  })
  @IsOptional()
  @IsDateString()
  expected_updated_at?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Paris, France' })
  @IsOptional()
  @IsString()
  location_name?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 48.8566 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({ description: 'Longitude coordinate', example: 2.3522 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @ApiPropertyOptional({ description: 'Order index in route', example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  order_index?: number;

  @ApiPropertyOptional({ description: 'Arrival date at this location', example: '2025-12-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  arrival_date?: string | null;

  @ApiPropertyOptional({ description: 'Departure date from this location', example: '2025-12-05T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  departure_date?: string | null;

  @ApiPropertyOptional({ description: 'Map marker color (#RRGGBB); null clears custom color', example: '#3b82f6' })
  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string')
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  marker_color?: string | null;

  @ApiPropertyOptional({ description: 'Google Places place id' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  google_place_id?: string | null;

  @ApiPropertyOptional({ description: 'Primary photo URL for map / UI' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photo_url?: string | null;

  @ApiPropertyOptional({ description: 'Formatted address from Places' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  formatted_address?: string | null;
}

