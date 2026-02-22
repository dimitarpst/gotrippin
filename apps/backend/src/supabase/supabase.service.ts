import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateShareCode } from '@gotrippin/core';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    let supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

    // Ensure URL uses HTTPS
    if (supabaseUrl.startsWith('http://')) {
      supabaseUrl = supabaseUrl.replace('http://', 'https://');
      console.warn('[SupabaseService] URL was HTTP, converted to HTTPS');
    }

    console.log('[SupabaseService] Initializing with URL:', supabaseUrl.substring(0, 30) + '...');
    console.log('[SupabaseService] Service key length:', supabaseServiceKey?.length || 0);

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Helper method to get profiles
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Helper method to update profiles
  async updateProfile(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Helper method to create trips
  async createTrip(tripData: any) {
    // Generate unique share code
    let shareCode = generateShareCode();
    let isUnique = false;

    // Ensure uniqueness (very unlikely to collide with 62^8 combinations)
    while (!isUnique) {
      const { data: existing } = await this.supabase
        .from('trips')
        .select('id')
        .eq('share_code', shareCode)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        shareCode = generateShareCode();
      }
    }

    const { data, error } = await this.supabase
      .from('trips')
      .insert({ ...tripData, share_code: shareCode })
      .select('*, cover_photo:photos(*)')
      .single();

    if (error) throw error;
    return data;
  }

  // Helper method to get trips for a user (via bridge table)
  async getTrips(userId: string) {
    const { data, error } = await this.supabase
      .from('trip_members')
      .select('trip_id, trips(*, cover_photo:photos(*))')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    return data?.map((item: any) => item.trips).filter(Boolean) || [];
  }

  // Helper method to get a single trip (if user is a member)
  async getTrip(tripId: string, userId: string) {
    const { data: membership } = await this.supabase
      .from('trip_members')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    if (!membership) return null;

    const { data, error } = await this.supabase
      .from('trips')
      .select('*, cover_photo:photos(*)')
      .eq('id', tripId)
      .single();

    if (error) throw error;
    return data;
  }

  // Helper method to get a trip by share code (if user is a member)
  async getTripByShareCode(shareCode: string, userId: string) {
    const { data: trip, error: tripError } = await this.supabase
      .from('trips')
      .select('*, cover_photo:photos(*)')
      .eq('share_code', shareCode)
      .single();

    if (tripError || !trip) return null;

    const isMember = await this.isTripMember(trip.id, userId);
    if (!isMember) return null;

    return trip;
  }

  // Helper method to update trips
  async updateTrip(tripId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select('*, cover_photo:photos(*)')
      .single();

    if (error) throw error;
    return data;
  }

  // Helper method to delete trips
  async deleteTrip(tripId: string) {
    const { error } = await this.supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) throw error;
    return true;
  }

  // Helper method to add a member to a trip
  async addTripMember(tripId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('trip_members')
      .insert({ trip_id: tripId, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Helper method to remove a member from a trip
  async removeTripMember(tripId: string, userId: string) {
    const { error } = await this.supabase
      .from('trip_members')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  // Helper method to get members of a trip
  async getTripMembers(tripId: string) {
    const { data, error } = await this.supabase
      .from('trip_members')
      .select('user_id, joined_at, profiles(*)')
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Helper method to check if user is a member of a trip
  async isTripMember(tripId: string, userId: string) {
    const { data } = await this.supabase
      .from('trip_members')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }

  /** Update a photo's dominant_color (used after client-side extraction so next load has instant color). */
  async updatePhotoDominantColor(photoId: string, dominantColor: string) {
    const { error } = await this.supabase
      .from('photos')
      .update({ dominant_color: dominantColor })
      .eq('id', photoId);

    if (error) throw error;
  }
}
