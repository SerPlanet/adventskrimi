import { z } from 'zod';
import { Day, Id } from './common';

/** An insight of the case chain (WP20). Server and author only: the client never sees it. */
export const Insight = z.object({
  id: Id,
  text: z.string().min(1),
  /** insights that must be understood first (the chain) */
  needs: z.array(Id).default([]),
});
export const InsightsFile = z.object({ insights: z.array(Insight).default([]) });

/**
 * A corridor is a guided route for days 2-5 (WP20 §2): one room per day, day 3 is the guest room.
 * Guests in the same corridor share way and finds. Day 1 is the start room for everybody.
 */
export const Corridor = z.object({
  id: Id,
  route: z.record(z.coerce.number().pipe(Day), Id),
});
export const RoutesFile = z.object({ corridors: z.array(Corridor).default([]) });

export type Insight = z.infer<typeof Insight>;
export type Corridor = z.infer<typeof Corridor>;
