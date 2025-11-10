import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({
    example: 'eb757720-2ddc-4d11-91c7-4edfc5030876',
    description: 'User ID to add to the trip',
    required: true,
  })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  user_id: string;
}

