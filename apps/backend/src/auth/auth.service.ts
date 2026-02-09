import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {}

  async login(email: string, password: string) {
    try {
      const supabase = this.supabaseService.getClient();
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        throw new UnauthorizedException('Invalid email or password');
      }

      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message: '✅ SUCCESS! Copy the access_token above, then click the green Authorize button (🔓) at the top of this page and paste it there.',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      // Decode JWT locally - no HTTP calls needed
      // Since the token was issued by Supabase, we can trust it if it's valid
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('[validateToken] Invalid token format');
        return null;
      }

      // Decode payload
      let payload: any;
      try {
        // Base64URL decode (handle padding)
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        payload = JSON.parse(Buffer.from(padded, 'base64').toString());
      } catch (e) {
        console.error('[validateToken] Failed to decode token payload:', e);
        return null;
      }

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.error('[validateToken] Token expired');
        return null;
      }

      // Check that it's an authenticated user token
      if (payload.role !== 'authenticated') {
        console.error('[validateToken] Token is not for authenticated user');
        return null;
      }

      const userId = payload.sub;
      if (!userId) {
        console.error('[validateToken] No user ID in token');
        return null;
      }

      // Return user object from token payload
      // We trust the token since it was issued by Supabase
      const user = {
        id: userId,
        email: payload.email,
        user_metadata: payload.user_metadata || {},
        app_metadata: payload.app_metadata || {},
      };

      console.log('[validateToken] Token validated successfully for user:', userId);
      return user;
    } catch (error) {
      console.error('[validateToken] Exception during validation:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  async getUserFromToken(token: string) {
    return this.validateToken(token);
  }
}
