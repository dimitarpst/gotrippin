import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class InviteTripEmailDto {
  @ApiProperty({
    example: 'friend@example.com',
    description: 'Recipient email address for the trip invite',
    required: true,
  })
  @IsEmail({}, { message: 'A valid email address is required' })
  @MaxLength(320)
  email: string;
}
