import { z } from 'zod';

const PostMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000, 'Message too long'),
  /** Global-scope sessions only: attach full trip detail snapshot for this message turn (merged into session slots). */
  attached_trip_id: z.string().uuid().optional(),
});

export type PostMessageDto = z.infer<typeof PostMessageSchema>;

export const PostMessageDto = Object.assign(PostMessageSchema, {
  safeParse: PostMessageSchema.safeParse,
});
