import { Controller, Get, Post, UseGuards, Req, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

export class LoginDto {
  @ApiProperty({ 
    example: 'dist4000k@gmail.com', 
    description: 'Your email address',
    required: true 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ 
    example: 'yourpassword', 
    description: 'Your password',
    required: true,
    minLength: 6
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '🔑 Login and get access token for Swagger' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful. Copy the access_token and paste it in the Authorize button above (🔓)',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-here',
          email: 'user@example.com'
        },
        message: '✅ Copy the access_token above and click the Authorize button (🔓) at the top of this page'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials.email, credentials.password);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for auth module' })
  @ApiResponse({ status: 200, description: 'Auth module is operational' })
  getHealth() {
    return { status: 'Auth module is operational' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User information retrieved' })
  async getMe(@Req() request: any) {
    return {
      user: request.user,
      message: 'Token validated successfully'
    };
  }
}
