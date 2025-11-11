import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('images')
@Controller('images')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search images from Unsplash' })
  async searchImages(
    @Query('query') query: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Query parameter is required');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const perPageNum = perPage ? parseInt(perPage, 10) : 9;

    if (pageNum < 1) {
      throw new BadRequestException('Page must be >= 1');
    }

    return this.imagesService.searchImages(query, pageNum, perPageNum);
  }

  @Post('download')
  @ApiOperation({ summary: 'Track image download (Unsplash requirement)' })
  async trackDownload(@Body('downloadUrl') downloadUrl: string) {
    if (!downloadUrl) {
      throw new BadRequestException('downloadUrl is required');
    }

    await this.imagesService.trackDownload(downloadUrl);
    return { success: true };
  }
}

