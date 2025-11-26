import { IsString, IsNumber, IsOptional, Min, Max, IsInt, IsPositive, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTripLocationDto {
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
}

