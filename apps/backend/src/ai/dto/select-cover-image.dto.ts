import { z } from 'zod';

/** 1-based index matching the numbered cards in the cover picker (e.g. 6 = sixth image). */
export const SelectCoverImageBodyDto = z.object({
  index: z.number().int().min(1).max(24),
  /** Optional text from other island fields answered before picking the cover. */
  answers_summary: z.string().max(4000).optional(),
});

export type SelectCoverImageBody = z.infer<typeof SelectCoverImageBodyDto>;
