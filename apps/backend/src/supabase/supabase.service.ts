import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

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
    const { data, error } = await this.supabase
      .from('trips')
      .insert(tripData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Helper method to get trips for a user (via bridge table)
  async getTrips(userId: string) {
    const { data, error } = await this.supabase
      .from('trip_members')
      .select('trip_id, trips(*)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    // Extract just the trip data from the joined response
    return data?.map((item: any) => item.trips) || [];
  }

  // Helper method to get a single trip (if user is a member)
  async getTrip(tripId: string, userId: string) {
    // First check if user is a member
    const { data: membership } = await this.supabase
      .from('trip_members')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    if (!membership) return null;

    // Get the trip data
    const { data, error } = await this.supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) throw error;
    return data;
  }

  // Helper method to update trips
  async updateTrip(tripId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
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
}
