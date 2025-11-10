import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProfilesService {
  constructor(private supabaseService: SupabaseService) {}

  async createProfile(userId: string, data: any) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return profile;
    } catch (error) {
      throw new NotFoundException('Failed to create profile');
    }
  }

  async getProfile(userId: string) {
    try {
      const profile = await this.supabaseService.getProfile(userId);
      return profile;
    } catch (error) {
      throw new NotFoundException('Profile not found');
    }
  }

  async updateProfile(userId: string, updateData: Partial<{
    display_name: string;
    avatar_color: string;
    preferred_lng: string;
    avatar_url: string;
  }>) {
    try {
      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      const updatedProfile = await this.supabaseService.updateProfile(userId, filteredData);
      return updatedProfile;
    } catch (error) {
      throw new NotFoundException('Profile update failed');
    }
  }
}
