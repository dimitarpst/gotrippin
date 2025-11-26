import { IsString, IsUUID, IsOptional, IsBoolean, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityTypeEnum } from './create-activity.dto';

export class UpdateActivityDto {
  @ApiPropertyOptional({ description: 'Location ID this activity belongs to' })
  @IsOptional()
  @IsUUID()
  location_id?: string | null;

  @ApiPropertyOptional({ 
    description: 'Activity type', 
    enum: ActivityTypeEnum 
  })
  @IsOptional()
  @IsEnum(ActivityTypeEnum)
  type?: ActivityTypeEnum;

  @ApiPropertyOptional({ description: 'Activity title', example: 'Visit Eiffel Tower' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Book tickets in advance' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Start time', example: '2025-12-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  start_time?: string | null;

  @ApiPropertyOptional({ description: 'End time', example: '2025-12-01T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  end_time?: string | null;

  @ApiPropertyOptional({ description: 'Is this an all-day event?' })
  @IsOptional()
  @IsBoolean()
  all_day?: boolean;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'plane' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string | null;

  @ApiPropertyOptional({ description: 'Color hex code', example: '#FF6B6B' })
  @IsOptional()
  @IsString()
  color?: string | null;
}

