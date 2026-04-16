import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class PatchMemberRoleDto {
  @ApiProperty({ enum: ['editor', 'viewer'] })
  @IsIn(['editor', 'viewer'])
  role!: 'editor' | 'viewer';
}
