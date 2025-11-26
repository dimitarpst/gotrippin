import { IsString, IsUUID, IsOptional, IsBoolean, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ActivityTypeEnum {
  FLIGHT = 'flight',
  ACCOMMODATION = 'accommodation',
  RESTAURANT = 'restaurant',
  ATTRACTION = 'attraction',
  TRANSPORT = 'transport',
  CUSTOM = 'custom',
  CAR_RENTAL = 'car_rental',
  TRAIN = 'train',
  BUS = 'bus',
  FERRY = 'ferry',
  MUSEUM = 'museum',
  CONCERT = 'concert',
  SHOPPING = 'shopping',
  BEACH = 'beach',
  HIKING = 'hiking',
  OTHER = 'other',
}

export class CreateActivityDto {
  @ApiPropertyOptional({ description: 'Location ID this activity belongs to' })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiPropertyOptional({ 
    description: 'Activity type', 
    enum: ActivityTypeEnum,
    default: ActivityTypeEnum.CUSTOM 
  })
  @IsOptional()
  @IsEnum(ActivityTypeEnum)
  type?: ActivityTypeEnum;

  @ApiProperty({ description: 'Activity title', example: 'Visit Eiffel Tower' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Book tickets in advance' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Start time', example: '2025-12-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiPropertyOptional({ description: 'End time', example: '2025-12-01T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiPropertyOptional({ description: 'Is this an all-day event?', default: false })
  @IsOptional()
  @IsBoolean()
  all_day?: boolean;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'plane' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ description: 'Color hex code', example: '#FF6B6B' })
  @IsOptional()
  @IsString()
  color?: string;
}

