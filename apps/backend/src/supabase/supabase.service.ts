import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateShareCode } from '@gotrippin/core';

interface ProfileAiUsageRow {
  ai_tokens_used_total: number | null;
  ai_tokens_used_month: number | null;
  ai_tokens_month_start: string | null;
  ai_token_monthly_limit: number | null;
}

export interface UserAiLimitStatus {
  allowed: boolean;
  used: number;
  limit: number | null;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
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

  async checkUserAiLimit(userId: string): Promise<UserAiLimitStatus> {
    const usage = await this.getNormalizedProfileAiUsage(userId);

    return {
      allowed:
        usage.ai_token_monthly_limit == null ||
        usage.ai_tokens_used_month < usage.ai_token_monthly_limit,
      used: usage.ai_tokens_used_month,
      limit: usage.ai_token_monthly_limit,
    };
  }

  async updateUserAiUsage(userId: string, tokensUsed: number) {
    const usage = await this.getNormalizedProfileAiUsage(userId);
    const nextTotal = usage.ai_tokens_used_total + tokensUsed;
    const nextMonth = usage.ai_tokens_used_month + tokensUsed;

    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        ai_tokens_used_total: nextTotal,
        ai_tokens_used_month: nextMonth,
        ai_tokens_month_start: usage.ai_tokens_month_start,
      })
      .eq('id', userId)
      .select(
        'ai_tokens_used_total, ai_tokens_used_month, ai_tokens_month_start, ai_token_monthly_limit',
      )
      .single();

    if (error) throw error;
    return this.normalizeProfileAiUsageRow(data);
  }

  private async getNormalizedProfileAiUsage(
    userId: string,
  ): Promise<Required<ProfileAiUsageRow>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select(
        'ai_tokens_used_total, ai_tokens_used_month, ai_tokens_month_start, ai_token_monthly_limit',
      )
      .eq('id', userId)
      .single();

    if (error) throw error;

    const normalized = this.normalizeProfileAiUsageRow(data);
    const currentMonthStart = this.getCurrentMonthStart();

    if (normalized.ai_tokens_month_start === currentMonthStart) {
      return normalized;
    }

    const { data: resetData, error: resetError } = await this.supabase
      .from('profiles')
      .update({
        ai_tokens_used_month: 0,
        ai_tokens_month_start: currentMonthStart,
      })
      .eq('id', userId)
      .select(
        'ai_tokens_used_total, ai_tokens_used_month, ai_tokens_month_start, ai_token_monthly_limit',
      )
      .single();

    if (resetError) throw resetError;
    return this.normalizeProfileAiUsageRow(resetData);
  }

  private normalizeProfileAiUsageRow(
    row: ProfileAiUsageRow | null,
  ): Required<ProfileAiUsageRow> {
    return {
      ai_tokens_used_total: row?.ai_tokens_used_total ?? 0,
      ai_tokens_used_month: row?.ai_tokens_used_month ?? 0,
      ai_tokens_month_start:
        row?.ai_tokens_month_start ?? this.getCurrentMonthStart(),
      ai_token_monthly_limit: row?.ai_token_monthly_limit ?? null,
    };
  }

  private getCurrentMonthStart(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');

    return `${year}-${month}-01`;
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

  /**
   * Maps `trip_id` → member facepile rows (join order ascending): every member gets a label; photo optional.
   */
  async getTripMemberFacepilePreviews(
    tripIds: string[],
  ): Promise<Record<string, { user_id: string; avatar_url: string | null; label: string }[]>> {
    const result: Record<string, { user_id: string; avatar_url: string | null; label: string }[]> = {};
    if (tripIds.length === 0) {
      return result;
    }

    const { data, error } = await this.supabase
      .from('trip_members')
      .select('trip_id, user_id, joined_at, profiles(avatar_url, display_name)')
      .in('trip_id', tripIds)
      .order('joined_at', { ascending: true });

    if (error) {
      throw error;
    }

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null && !Array.isArray(value);

    const facepileFromProfiles = (
      profiles: unknown,
      userId: string,
    ): { user_id: string; avatar_url: string | null; label: string } => {
      let avatar_url: string | null = null;
      let displayName = '';
      if (profiles !== null && profiles !== undefined) {
        const applyProfile = (p: Record<string, unknown>) => {
          if (typeof p.avatar_url === 'string' && p.avatar_url.trim().length > 0) {
            avatar_url = p.avatar_url.trim();
          }
          if (typeof p.display_name === 'string') {
            displayName = p.display_name;
          }
        };
        if (Array.isArray(profiles)) {
          const first = profiles[0];
          if (isRecord(first)) {
            applyProfile(first);
          }
        } else if (isRecord(profiles)) {
          applyProfile(profiles);
        }
      }
      const trimmed = displayName.trim();
      const label =
        trimmed.length > 0
          ? trimmed
          : userId.length > 4
            ? `${userId.slice(0, 8)}…`
            : userId;
      return { user_id: userId, avatar_url, label };
    };

    for (const row of data ?? []) {
      if (!isRecord(row) || typeof row.trip_id !== 'string' || typeof row.user_id !== 'string') {
        continue;
      }
      const tripId = row.trip_id;
      const userId = row.user_id;
      const entry = facepileFromProfiles(row.profiles, userId);
      if (!result[tripId]) {
        result[tripId] = [];
      }
      if (result[tripId].length >= 12) {
        continue;
      }
      if (result[tripId].some((e) => e.user_id === userId)) {
        continue;
      }
      result[tripId].push(entry);
    }

    return result;
  }

  /**
   * Trips created before `created_by` was enforced may have a null creator.
   * Treat the earliest `trip_members` row (by id) as the effective creator for permissions and UI.
   */
  async resolveTripCreatorUserId(tripId: string): Promise<string | null> {
    try {
      const { data: trip, error: tripErr } = await this.supabase
        .from('trips')
        .select('created_by')
        .eq('id', tripId)
        .maybeSingle();

      if (tripErr) {
        this.logger.warn(`resolveTripCreatorUserId: trips select failed (${tripId})`, tripErr);
        return null;
      }

      if (!trip || typeof trip !== 'object') {
        return null;
      }

      const existing =
        'created_by' in trip &&
        typeof trip.created_by === 'string' &&
        trip.created_by.length > 0
          ? trip.created_by
          : null;
      if (existing) {
        return existing;
      }

      // Order by user_id — trip_members may not have a surrogate `id` column in all deployments.
      const { data: rows, error: memErr } = await this.supabase
        .from('trip_members')
        .select('user_id')
        .eq('trip_id', tripId)
        .order('user_id', { ascending: true })
        .limit(1);

      if (memErr) {
        this.logger.warn(`resolveTripCreatorUserId: trip_members select failed (${tripId})`, memErr);
        return null;
      }

      const first = rows?.[0];
      if (first && typeof first === 'object' && 'user_id' in first && typeof first.user_id === 'string') {
        return first.user_id;
      }
      return null;
    } catch (err) {
      this.logger.warn(`resolveTripCreatorUserId: unexpected error (${tripId})`, err);
      return null;
    }
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

  // Helper method to get a trip by share code or by trip id (if user is a member)
  async getTripByShareCode(shareCode: string, userId: string) {
    const byShareCode = await this.supabase
      .from('trips')
      .select('*, cover_photo:photos(*)')
      .eq('share_code', shareCode)
      .single();

    let trip = byShareCode.data;
    const tripError = byShareCode.error;

    // If not found by share_code and param looks like a UUID, try by id (e.g. /trips/<uuid>)
    if ((tripError || !trip) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shareCode)) {
      const byId = await this.supabase
        .from('trips')
        .select('*, cover_photo:photos(*)')
        .eq('id', shareCode)
        .single();
      trip = byId.data;
    }

    if (!trip) return null;

    const isMember = await this.isTripMember(trip.id, userId);
    if (!isMember) return null;

    return trip;
  }

  /**
   * Resolve a trip by share code (or UUID in URL) without membership check — for join-by-link after auth.
   */
  async resolveTripForJoinByShareCodeParam(shareCode: string): Promise<{
    id: string;
    share_code: string;
    title: string | null;
  } | null> {
    const byShareCode = await this.supabase
      .from('trips')
      .select('id, share_code, title')
      .eq('share_code', shareCode)
      .single();

    let row = byShareCode.data;
    const tripError = byShareCode.error;

    if ((tripError || !row) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shareCode)) {
      const byId = await this.supabase
        .from('trips')
        .select('id, share_code, title')
        .eq('id', shareCode)
        .single();
      row = byId.data;
    }

    if (!row?.id || !row.share_code) return null;
    return { id: row.id, share_code: row.share_code, title: row.title ?? null };
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

  /** Role for a trip member; null if not a member. */
  async getTripMemberRole(
    tripId: string,
    userId: string,
  ): Promise<'editor' | 'viewer' | null> {
    const { data, error } = await this.supabase
      .from('trip_members')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data || typeof data.role !== 'string') {
      return null;
    }
    return data.role === 'viewer' ? 'viewer' : 'editor';
  }

  /** Throws 403 if the user is not an editor on this trip. */
  async assertTripEditor(tripId: string, userId: string): Promise<void> {
    const role = await this.getTripMemberRole(tripId, userId);
    if (role !== 'editor') {
      throw new ForbiddenException('Only editors can change this trip');
    }
  }

  async countTripEditors(tripId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('trip_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('trip_id', tripId)
      .eq('role', 'editor');

    if (error) throw error;
    return count ?? 0;
  }

  async updateTripMemberRole(
    tripId: string,
    memberUserId: string,
    role: 'editor' | 'viewer',
  ): Promise<void> {
    const { error } = await this.supabase
      .from('trip_members')
      .update({ role })
      .eq('trip_id', tripId)
      .eq('user_id', memberUserId);

    if (error) throw error;
  }

  // Helper method to add a member to a trip
  async addTripMember(tripId: string, userId: string, role: 'editor' | 'viewer' = 'editor') {
    const { data, error } = await this.supabase
      .from('trip_members')
      .insert({ trip_id: tripId, user_id: userId, role })
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
      .select('user_id, joined_at, role, profiles(*)')
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

  // --- AI sessions (ai_sessions table) ---

  async createAiSession(params: {
    user_id: string;
    trip_id: string | null;
    scope: 'global' | 'trip';
    model_name?: string;
  }) {
    const { data, error } = await this.supabase
      .from('ai_sessions')
      .insert({
        user_id: params.user_id,
        trip_id: params.trip_id,
        scope: params.scope,
        model_name: params.model_name ?? 'z-ai/glm-5',
        summary: null,
        slots: {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAiSession(sessionId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('ai_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  }

  async listAiSessions(
    userId: string,
    opts: { scope?: 'global' | 'trip'; trip_id?: string; limit?: number; offset?: number } = {},
  ) {
    const { scope = 'global', trip_id, limit = 20, offset = 0 } = opts;
    let q = this.supabase
      .from('ai_sessions')
      .select('id, scope, summary, created_at, updated_at, trip_id')
      .eq('user_id', userId)
      .eq('scope', scope)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (scope === 'trip' && trip_id) {
      q = q.eq('trip_id', trip_id);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }

  async updateAiSession(
    sessionId: string,
    userId: string,
    updates: { summary?: string | null; slots?: Record<string, unknown> },
  ) {
    const { data, error } = await this.supabase
      .from('ai_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAiSession(sessionId: string, userId: string) {
    const { error } = await this.supabase
      .from('ai_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getAiMessages(sessionId: string, limit = 20) {
    const { data, error } = await this.supabase
      .from('ai_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  async insertAiMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'tool' | 'system',
    content: Record<string, unknown> | string,
  ) {
    const payload =
      typeof content === 'string' ? { text: content } : content;
    const { error } = await this.supabase.from('ai_messages').insert({
      session_id: sessionId,
      role,
      content: payload,
    });
    if (error) throw error;
  }

  // --- Trip gallery (trip_gallery_images) ---

  async listTripGalleryImages(tripId: string) {
    const { data, error } = await this.supabase
      .from('trip_gallery_images')
      .select('id, trip_id, storage_key, blur_hash, width, height, sort_order, created_by, created_at')
      .eq('trip_id', tripId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async countTripGalleryImages(tripId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('trip_gallery_images')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    if (error) throw error;
    return count ?? 0;
  }

  async getTripGalleryImageById(imageId: string) {
    const { data, error } = await this.supabase
      .from('trip_gallery_images')
      .select('id, trip_id, storage_key, blur_hash, width, height, sort_order, created_by, created_at')
      .eq('id', imageId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async insertTripGalleryImage(row: {
    trip_id: string;
    storage_key: string;
    blur_hash?: string | null;
    width?: number | null;
    height?: number | null;
    sort_order: number;
    created_by: string;
  }) {
    const { data, error } = await this.supabase
      .from('trip_gallery_images')
      .insert(row)
      .select('id, trip_id, storage_key, blur_hash, width, height, sort_order, created_by, created_at')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTripGalleryImageRow(imageId: string) {
    const { error } = await this.supabase
      .from('trip_gallery_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;
  }
}
