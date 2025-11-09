import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProfilesService {
  constructor(private supabaseService: SupabaseService) {}

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
