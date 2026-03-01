import { z } from 'zod';

const CreateSessionSchema = z.object({
  scope: z.enum(['global', 'trip']),
  trip_id: z.string().uuid().optional(),
  initial_message: z.string().max(2000).optional(),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;

export const CreateSessionDto = Object.assign(CreateSessionSchema, {
  safeParse: CreateSessionSchema.safeParse,
});
