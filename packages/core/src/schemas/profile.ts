import { z } from 'zod';

/**
 * Zod schema for user profile
 * Matches the `public.profiles` table in Supabase
 */
export const ProfileSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  display_name: z.string().nullable().optional(),
  avatar_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .nullable()
    .optional(),
  avatar_url: z.string().url('Invalid avatar URL').nullable().optional(),
  preferred_lng: z.enum(['en', 'bg']).nullable().optional(),
});

/**
 * Schema for creating a new profile
 * ID is auto-generated, other fields are optional
 */
export const CreateProfileSchema = ProfileSchema.partial().required({ id: true });

/**
 * Schema for updating an existing profile
 * All fields are optional except ID
 */
export const UpdateProfileSchema = ProfileSchema.partial().required({ id: true });

/**
 * Schema for profile update request (without ID)
 * Used in API endpoints where ID comes from route params
 */
export const ProfileUpdateDataSchema = ProfileSchema.omit({ id: true }).partial();

/**
 * TypeScript types inferred from Zod schemas
 */
export type Profile = z.infer<typeof ProfileSchema>;
export type CreateProfile = z.infer<typeof CreateProfileSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type ProfileUpdateData = z.infer<typeof ProfileUpdateDataSchema>;


