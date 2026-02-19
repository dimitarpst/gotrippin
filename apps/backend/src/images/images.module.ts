import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [HttpModule, AuthModule, SupabaseModule],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
