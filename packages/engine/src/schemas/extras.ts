import { z } from 'zod';
import { CardText, Day, Id, listFile } from './common';

export const PUZZLE_TYPES = ['code', 'cipher', 'letters', 'crossref', 'contradiction'] as const;

/** Objekt-Rätsel: a lock in front of a source. Answer is server only. */
export const Puzzle = z.object({
  id: Id,
  type: z.enum(PUZZLE_TYPES),
  room: Id,
  prompt: CardText,
  answer: z.string().min(1),
  /** tip ladder: tip 1, tip 2 (solution is shown last) */
  hints: z.array(z.string().min(1)).length(2),
  /** source this puzzle unlocks (that source lists it in `requires`) */
  unlocks: Id,
});

/** Gegenstand (inventory item) */
export const Item = z.object({ id: Id, name: z.string().min(1), text: CardText });

export const PuzzlesFile = z.object({
  puzzles: z.array(Puzzle),
  items: z.array(Item).default([]),
});

export const Event = z.object({
  day: Day,
  headline: z.string().min(1),
  text: CardText,
  weather: z.string().optional(),
  blocked_rooms: z.array(Id).default([]),
  bonus_rooms: z.array(Id).default([]),
});
export const EventsFile = listFile('events', Event);

export const NewspaperFile = z.object({
  gossip: z.array(
    z.object({ id: Id, text: z.string().min(1), min_players: z.number().int().optional() }),
  ),
  ads: z.array(z.object({ id: Id, text: z.string().min(1) })).default([]),
  plaque_titles: z.array(z.string().min(1)).default([]),
  filler: z.array(z.object({ id: Id, day: Day.optional(), text: z.string().min(1) })).default([]),
});

export const Question = z.object({
  id: Id,
  day: Day,
  text: z.string().min(1),
  options: z
    .array(z.object({ id: Id, text: z.string().min(1) }))
    .min(2)
    .max(4),
  correct: Id,
  /** where the answer can be found */
  from: z.enum(['newspaper', 'hotelbook']),
  hint: z.string().optional(),
});
export const QuestionsFile = listFile('questions', Question);

export const PrologFile = z.object({
  days: z.array(
    z.object({
      day: Day,
      goal: z.string().min(1),
      actions: z.number().int().min(1),
      intro: CardText,
      tips: z.array(z.string()).default([]),
    }),
  ),
  mini_case: z.object({ title: z.string().min(1), text: CardText }),
  page_texts: z.array(z.object({ id: Id, text: CardText })).default([]),
});

export type Puzzle = z.infer<typeof Puzzle>;
export type Event = z.infer<typeof Event>;
export type Question = z.infer<typeof Question>;
