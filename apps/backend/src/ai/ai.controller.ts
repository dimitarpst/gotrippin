import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create an AI chat session (global or trip-scoped)' })
  @ApiBody({
    description: 'Scope and optional trip_id (required when scope is "trip")',
    schema: {
      type: 'object',
      properties: {
        scope: { type: 'string', enum: ['global', 'trip'] },
        trip_id: { type: 'string', format: 'uuid' },
        initial_message: { type: 'string' },
      },
      required: ['scope'],
    },
  })
  @ApiResponse({ status: 201, description: 'Session created; returns session_id and optional welcome_message' })
  @ApiResponse({ status: 400, description: 'Invalid body or not a trip member' })
  async createSession(
    @Req() request: { user: { id: string } },
    @Body() body: CreateSessionDto,
  ) {
    const result = CreateSessionDto.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Invalid session data',
        errors: result.error.flatten(),
      });
    }
    const userId = request.user.id;
    return this.aiService.createSession(userId, result.data);
  }
}
