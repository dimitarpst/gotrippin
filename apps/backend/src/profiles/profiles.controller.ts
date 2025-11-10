import { Controller, Get, Put, Post, Param, Body, UseGuards, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('initialize')
  @ApiOperation({ summary: '🆕 Create your profile (run this first if you get 404 errors)' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 400, description: 'Profile already exists' })
  async initializeProfile(@Req() request: any) {
    const userId = request.user.id;
    const userEmail = request.user.email;
    
    try {
      // Check if profile already exists
      const existing = await this.profilesService.getProfile(userId);
      if (existing) {
        throw new BadRequestException('Profile already exists. Use PUT /profiles to update it.');
      }
    } catch (error) {
      // Profile doesn't exist, create it
      if (error instanceof NotFoundException) {
        return this.profilesService.createProfile(userId, {
          display_name: userEmail?.split('@')[0] || 'User',
          avatar_color: '#ff6b6b',
          preferred_lng: 'en',
        });
      }
      throw error;
    }
  }

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
