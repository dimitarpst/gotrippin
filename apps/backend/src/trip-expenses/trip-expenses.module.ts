import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { TripExpensesService } from './trip-expenses.service';
import { TripExpensesController } from './trip-expenses.controller';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [TripExpensesController],
  providers: [TripExpensesService],
  exports: [TripExpensesService],
})
export class TripExpensesModule {}
