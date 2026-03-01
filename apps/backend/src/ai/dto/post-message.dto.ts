import { z } from 'zod';

const PostMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000, 'Message too long'),
});

export type PostMessageDto = z.infer<typeof PostMessageSchema>;

export const PostMessageDto = Object.assign(PostMessageSchema, {
  safeParse: PostMessageSchema.safeParse,
});
