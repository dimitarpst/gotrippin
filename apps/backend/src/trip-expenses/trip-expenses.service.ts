import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateTripExpense, UpdateTripExpense } from '@gotrippin/core';

@Injectable()
export class TripExpensesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private async validateTripMembership(tripId: string, userId: string): Promise<void> {
    const isMember = await this.supabaseService.isTripMember(tripId, userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this trip to access expenses');
    }
  }

  private async validateLocationBelongsToTrip(locationId: string, tripId: string): Promise<void> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('trip_locations')
      .select('trip_id')
      .eq('id', locationId)
      .single();

    if (error || !data) {
      throw new BadRequestException('Location not found');
    }
    if (data.trip_id !== tripId) {
      throw new BadRequestException('Location does not belong to this trip');
    }
  }

  private async validateActivityBelongsToTrip(
    activityId: string,
    tripId: string,
  ): Promise<{ trip_id: string; location_id: string | null }> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('activities')
      .select('trip_id, location_id')
      .eq('id', activityId)
      .single();

    if (error || !data) {
      throw new BadRequestException('Activity not found');
    }
    if (data.trip_id !== tripId) {
      throw new BadRequestException('Activity does not belong to this trip');
    }
    return data;
  }

  async listExpenses(
    tripId: string,
    userId: string,
    filters?: { locationId?: string; activityId?: string },
  ) {
    await this.validateTripMembership(tripId, userId);

    let query = this.supabaseService
      .getClient()
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('spent_at', { ascending: false });

    if (filters?.locationId) {
      query = query.eq('location_id', filters.locationId);
    }
    if (filters?.activityId) {
      query = query.eq('activity_id', filters.activityId);
    }

    const { data, error } = await query;

    if (error) {
      throw new NotFoundException('Failed to fetch expenses');
    }

    return data ?? [];
  }

  async getExpense(expenseId: string, userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('trip_expenses')
      .select('*')
      .eq('id', expenseId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Expense not found');
    }

    await this.validateTripMembership(data.trip_id, userId);
    return data;
  }

  async createExpense(tripId: string, userId: string, dto: CreateTripExpense) {
    await this.validateTripMembership(tripId, userId);

    if (dto.location_id) {
      await this.validateLocationBelongsToTrip(dto.location_id, tripId);
    }

    if (dto.activity_id) {
      const act = await this.validateActivityBelongsToTrip(dto.activity_id, tripId);
      if (
        dto.location_id &&
        act.location_id != null &&
        act.location_id !== dto.location_id
      ) {
        throw new BadRequestException(
          'location_id does not match the activity’s stop',
        );
      }
    }

    const spentAt = dto.spent_at ?? new Date().toISOString();

    const { data, error } = await this.supabaseService
      .getClient()
      .from('trip_expenses')
      .insert({
        trip_id: tripId,
        location_id: dto.location_id ?? null,
        activity_id: dto.activity_id ?? null,
        amount_minor: dto.amount_minor,
        currency_code: dto.currency_code,
        title: dto.title,
        notes: dto.notes ?? null,
        category: dto.category ?? null,
        spent_at: spentAt,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException(error.message || 'Failed to create expense');
    }

    return data;
  }

  async updateExpense(
    tripId: string,
    expenseId: string,
    userId: string,
    dto: UpdateTripExpense,
  ) {
    const existing = await this.getExpense(expenseId, userId);
    if (existing.trip_id !== tripId) {
      throw new NotFoundException('Expense not found');
    }

    if (dto.location_id !== undefined && dto.location_id !== null) {
      await this.validateLocationBelongsToTrip(dto.location_id, tripId);
    }

    if (dto.activity_id !== undefined && dto.activity_id !== null) {
      const act = await this.validateActivityBelongsToTrip(dto.activity_id, tripId);
      const nextLocationId =
        dto.location_id !== undefined ? dto.location_id : existing.location_id;
      if (
        nextLocationId &&
        act.location_id != null &&
        act.location_id !== nextLocationId
      ) {
        throw new BadRequestException(
          'location_id does not match the activity’s stop',
        );
      }
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.location_id !== undefined) {
      patch.location_id = dto.location_id;
    }
    if (dto.activity_id !== undefined) {
      patch.activity_id = dto.activity_id;
    }
    if (dto.amount_minor !== undefined) {
      patch.amount_minor = dto.amount_minor;
    }
    if (dto.currency_code !== undefined) {
      patch.currency_code = dto.currency_code;
    }
    if (dto.title !== undefined) {
      patch.title = dto.title;
    }
    if (dto.notes !== undefined) {
      patch.notes = dto.notes;
    }
    if (dto.category !== undefined) {
      patch.category = dto.category;
    }
    if (dto.spent_at !== undefined) {
      patch.spent_at = dto.spent_at;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('trip_expenses')
      .update(patch)
      .eq('id', expenseId)
      .eq('trip_id', tripId)
      .select('*')
      .single();

    if (error || !data) {
      throw new BadRequestException(error?.message || 'Failed to update expense');
    }

    return data;
  }

  async deleteExpense(tripId: string, expenseId: string, userId: string) {
    const existing = await this.getExpense(expenseId, userId);
    if (existing.trip_id !== tripId) {
      throw new NotFoundException('Expense not found');
    }

    const { error } = await this.supabaseService
      .getClient()
      .from('trip_expenses')
      .delete()
      .eq('id', expenseId)
      .eq('trip_id', tripId);

    if (error) {
      throw new BadRequestException(error.message || 'Failed to delete expense');
    }

    return { ok: true };
  }
}
