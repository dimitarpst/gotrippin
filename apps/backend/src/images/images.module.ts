import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}

