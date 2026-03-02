import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { PostMessageDto } from './dto/post-message.dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@ApiBearerAuth('JWT-auth')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'List AI chat sessions (global or trip-scoped) with pagination' })
  @ApiResponse({ status: 200, description: 'List of sessions ordered by updated_at desc' })
  async listSessions(
    @Req() request: { user: { id: string } },
    @Query('scope') scope?: 'global' | 'trip',
    @Query('trip_id') tripId?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const userId = request.user.id;
    const scopeVal = scope === 'trip' ? 'trip' : 'global';
    const limit = Math.min(Math.max(parseInt(limitStr ?? '20', 10) || 20, 1), 50);
    const offset = Math.max(parseInt(offsetStr ?? '0', 10) || 0, 0);
    return this.aiService.listSessions(
      userId,
      scopeVal,
      scopeVal === 'trip' ? tripId ?? null : null,
      { limit, offset },
    );
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get a session with its messages (for opening a chat)' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session and messages' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(
    @Req() request: { user: { id: string } },
    @Param('sessionId') sessionId: string,
  ) {
    const userId = request.user.id;
    return this.aiService.getSessionWithMessages(userId, sessionId);
  }

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

  @Patch('sessions/:sessionId')
  @ApiOperation({ summary: 'Update session (e.g. rename/summary)' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Updated session' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateSession(
    @Req() request: { user: { id: string } },
    @Param('sessionId') sessionId: string,
    @Body() body: { summary?: string | null },
  ) {
    const userId = request.user.id;
    return this.aiService.updateSessionSummary(
      userId,
      sessionId,
      body.summary ?? null,
    );
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat session and its messages' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({ status: 204, description: 'Session deleted' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteSession(
    @Req() request: { user: { id: string } },
    @Param('sessionId') sessionId: string,
  ) {
    const userId = request.user.id;
    await this.aiService.deleteSession(userId, sessionId);
  }

  @Post('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Send a message and get AI response (with tool execution)' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
  })
  @ApiResponse({ status: 200, description: 'Assistant message and optional tool_calls list' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async postMessage(
    @Req() request: { user: { id: string } },
    @Param('sessionId') sessionId: string,
    @Body() body: PostMessageDto,
  ) {
    const result = PostMessageDto.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Invalid message data',
        errors: result.error.flatten(),
      });
    }
    const userId = request.user.id;
    return this.aiService.postMessage(userId, sessionId, result.data);
  }
}
