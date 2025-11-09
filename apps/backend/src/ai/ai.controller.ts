import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommendations')
  @ApiOperation({ summary: 'Get AI travel recommendations' })
  @ApiResponse({ status: 200, description: 'AI recommendations retrieved' })
  async getRecommendations(@Body('query') query: string) {
    return this.aiService.getRecommendations(query);
  }
}
