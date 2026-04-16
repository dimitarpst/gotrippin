import { IsString, IsNumber, IsOptional, Min, Max, IsInt, IsPositive, IsDateString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTripLocationDto {
  @ApiProperty({ description: 'Location name', example: 'Paris, France' })
  @IsString()
  location_name: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 48.8566 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate', example: 2.3522 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Order index in route (auto-assigned if not provided)', example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  order_index?: number;

  @ApiPropertyOptional({ description: 'Arrival date at this location', example: '2025-12-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  arrival_date?: string;

  @ApiPropertyOptional({ description: 'Departure date from this location', example: '2025-12-05T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  departure_date?: string;

  @ApiPropertyOptional({ description: 'Map marker color (#RRGGBB)', example: '#ff7670' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  marker_color?: string;

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

