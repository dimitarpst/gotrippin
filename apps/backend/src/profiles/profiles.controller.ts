import { Controller, Get, Put, Param, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@Param('id') id: string) {
    return this.profilesService.getProfile(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getMyProfile(@Req() request: any) {
    const userId = request.user.id;
    return this.profilesService.getProfile(userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid profile data' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateProfile(
    @Param('id') id: string,
    @Body() data: UpdateProfileDto
  ) {
    // Validate using shared Zod schema
    const result = UpdateProfileDto.safeParse(data);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Invalid profile data',
        errors: result.error.flatten(),
      });
    }

    return this.profilesService.updateProfile(id, result.data);
  }

  @Put()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid profile data' })
  async updateMyProfile(
    @Req() request: any,
    @Body() data: UpdateProfileDto
  ) {
    // Validate using shared Zod schema
    const result = UpdateProfileDto.safeParse(data);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Invalid profile data',
        errors: result.error.flatten(),
      });
    }

    const userId = request.user.id;
    return this.profilesService.updateProfile(userId, result.data);
  }
}
