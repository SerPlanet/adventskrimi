import { z } from 'zod';
import { Category, Id } from './common';

const Time = z.string().regex(/^\d{2}:\d{2}$/);

export const TimeWindow = z.object({ id: Id, label: z.string(), from: Time, to: Time });

export const ProofQuestion = z.object({
  id: Id,
  text: z.string().min(1),
  options: z.array(z.object({ id: Id, text: z.string().min(1) })).length(4),
  correct: z.array(Id).min(1),
});

/** case.yaml. Contains the SOLUTION: server only. */
export const CaseFile = z.object({
  id: Id,
  title: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  night: z.object({ from: Time, to: Time }),
  windows: z.array(TimeWindow).min(1),
  /** Candidate ids per category (who/accomplice: npc ids, when: window ids, where: room ids). */
  categories: z.record(Category, z.array(Id).min(2)),
  solution: z.record(Category, Id),
  proof_questions: z.array(ProofQuestion).length(2),
  /** story of each day: what the player should understand, the planned aha moment */
  beats: z
    .array(
      z.object({
        day: z.number().int().min(1).max(24),
        title: z.string().min(1),
        aha: z.string().min(1),
        insight: z.string().min(1),
        thread: z.string().optional(),
      }),
    )
    .default([]),
});

/** world.yaml: ground truth. SPOILER. */
export const WorldFile = z.object({
  /** person id -> window id -> room id */
  positions: z.record(Id, z.record(Id, Id)),
  crime: z.object({
    thief: Id,
    accomplice: Id,
    window: Id,
    theft_room: Id,
    distraction_room: Id,
    hiding_place: Id,
    steps: z.array(z.string()).min(1),
  }),
});

export type CaseFile = z.infer<typeof CaseFile>;
export type WorldFile = z.infer<typeof WorldFile>;
