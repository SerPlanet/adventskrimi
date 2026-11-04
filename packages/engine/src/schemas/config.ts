import { z } from 'zod';
import { Day, Id } from './common';

const NonNeg = z.number().min(0); // invariant 2: no negative points

export const Profile = z.object({
  id: Id,
  name: z.string().min(1),
  /** subset of the full case; omitted = everything */
  include: z
    .object({
      rooms: z.array(Id).optional(),
      npcs: z.array(Id).optional(),
      exclude_facts: z.array(Id).default([]),
      exclude_sources: z.array(Id).default([]),
      /** merged window groups, e.g. 4 x 2 h out of 8 x 1 h */
      window_groups: z.record(Id, z.array(Id)).optional(),
    })
    .default({ exclude_facts: [], exclude_sources: [] }),
  /** budget for "Genauer untersuchen" (02b §1, D62, D76): `default`, with overrides by day */
  actions_by_day: z.object({
    default: z.number().int().min(1),
    days: z.record(z.coerce.number().pipe(Day), z.number().int().min(1)).default({}),
  }),
  /** narrative and address variants of the player (D78); no difference in play */
  roles: z
    .array(
      z.object({
        id: Id,
        name: z.string().min(1),
        anrede: z.string().min(1),
        intro: z.string().min(1),
      }),
    )
    .default([]),
  hints: z.object({ tip_ladder: z.boolean().default(true), max_tips: z.number().int().default(2) }),
  early_accusation: z.boolean(),
  early_accusation_from_day: Day,
  rumor_min_players: z.number().int().min(1),
  /** share of active players in one room that counts as "Großversammlung" */
  crowd_share: z.number().min(0).max(1),
  chess: z.boolean().default(false),
  max_liars: z.number().int().min(0),
});

export const Scoring = z.object({
  day: z.object({
    played: NonNeg,
    find: NonNeg,
    find_cap: NonNeg,
    question: NonNeg,
    question_hint: NonNeg,
    puzzle: NonNeg,
    puzzle_hint: NonNeg,
  }),
  prolog_mini_case: NonNeg,
  /** newspaper puzzle solved after its calendar day: points times this factor (D77) */
  newspaper_puzzle_late_factor: z.number().min(0).max(1),
  first_discoverer: NonNeg,
  report_card: z.object({ per_category: NonNeg, days: z.array(Day).min(1) }),
  finale: z.object({ who: NonNeg, accomplice: NonNeg, when: NonNeg, where: NonNeg, proof: NonNeg }),
  early_accusation: z.object({ factor: NonNeg, last_day: Day }),
  /** a tip divides points of that one item (rounded down) */
  hint_divisor: z.number().min(1),
  ranks: z.array(z.object({ name: z.string().min(1), min_points: NonNeg })).min(1),
});

export const Quality = z.object({
  /** lie web and a beat for every day are required (02b §5); only tiny test cases switch it off */
  lie_web: z.boolean(),
  card_words_max: z.number().int(),
  newspaper_words_max: z.number().int(),
  family_sentence_words_max: z.number().int(),
  redundancy_min: z.object({ friends: z.number().int(), family: z.number().int() }),
  tempo: z.object({ earliest_day: Day, latest_day: Day }),
  min_reinterpreted_finds: z.number().int(),
  min_statement_fact_contradictions: z.number().int(),
  min_statement_statement_contradictions: z.number().int(),
  red_herrings_min: z.object({ friends: z.number().int(), family: z.number().int() }),
  liars_max: z.object({ friends: z.number().int(), family: z.number().int() }),
  bots: z.object({
    random_median_max_candidates: z.number().int(),
    casual_median_max_candidates: z.number().int(),
    worst_max_candidates: z.number().int(),
  }),
  /** insight evidence checks (WP20): proofs per insight, random-sample solvability */
  insights: z.object({
    min_proofs: z.number().int().min(1),
    sample_share: z.number().min(0).max(1),
    sample_runs: z.number().int().min(1),
    sample_min_success: z.number().min(0).max(1),
    /** words and phrases a proof must not contain (it never names a verdict, 02b §3) */
    verdict_words: z.array(z.string().min(1)).min(1),
  }),
  mind_share_min: z.number().min(0).max(1),
  daily_minutes_max: z.number(),
  reading_wpm: z.number(),
});

export type Profile = z.infer<typeof Profile>;
export type Scoring = z.infer<typeof Scoring>;
export type Quality = z.infer<typeof Quality>;
