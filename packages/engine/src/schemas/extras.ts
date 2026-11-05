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
  /** time of day / mood of the morning, one sentence for the narrative (02c §2) */
  morgen: z.string().optional(),
  /** a longer opening of the day as short cards (WP22b), told before the room; e.g. the morning of the theft */
  story: z.array(CardText).default([]),
  blocked_rooms: z.array(Id).default([]),
  bonus_rooms: z.array(Id).default([]),
});
export const EventsFile = listFile('events', Event);

export const NewspaperFile = z.object({
  gossip: z.array(
    z.object({ id: Id, text: z.string().min(1), min_players: z.number().int().optional() }),
  ),
  ads: z.array(z.object({ id: Id, text: z.string().min(1) })).default([]),
  /** stories of the daily paper (02c §3): 50-100 words, facts only, relations told as a story */
  articles: z
    .array(
      z.object({
        id: Id,
        day: Day,
        title: z.string().min(1),
        text: z.string().min(1),
        kind: z.enum(['bericht', 'klatsch', 'kurzmeldung', 'anzeige']).default('klatsch'),
        /** facts the article carries */
        traegt: z.array(Id).default([]),
      }),
    )
    .default([]),
  /** joke of the day (WP24): 1-2 sentences, no link to the figures or the case, never a proof */
  jokes: z
    .array(
      z.object({
        id: Id,
        day: Day,
        kind: z.enum(['wortwitz', 'flachwitz', 'winter', 'hotel']),
        text: z.string().min(1),
      }),
    )
    .default([]),
  /** last day the validator demands the full paper structure of; later days report "content follows" (D80) */
  paper_required_through: z.number().int().min(0).max(24).default(24),
  plaque_titles: z.array(z.string().min(1)).default([]),
  filler: z.array(z.object({ id: Id, day: Day.optional(), text: z.string().min(1) })).default([]),
});

/** Kinds of the riddle of the day (WP24, D88). */
export const RIDDLE_KINDS = ['sudoku', 'wordle', 'word', 'cipher', 'number', 'logic'] as const;

/** Riddle rotation and word lists of a case (Invariante 12: no content in code). Server only. */
export const RiddlesFile = z.object({
  /** day n uses entry (n-1) mod length */
  rotation: z.array(z.enum(RIDDLE_KINDS)).min(1),
  /** anagram words by level */
  anagrams: z.object({
    easy: z.array(z.string().min(3)).min(1),
    medium: z.array(z.string().min(3)).min(1),
    hard: z.array(z.string().min(3)).min(1),
  }),
  /** five-letter words (A-Z only): the answers and the accepted guesses of the wordle */
  wordle: z.array(z.string().regex(/^[A-Z]{5}$/)).min(10),
  /** short sentences for the Caesar cipher (letters and spaces) */
  phrases: z.array(z.string().regex(/^[A-Za-zÄÖÜäöüß ]{6,30}$/)).min(1),
});

export const PrologFile = z.object({
  days: z.array(
    z.object({
      day: Day,
      goal: z.string().min(1),
      intro: CardText,
      tips: z.array(z.string()).default([]),
    }),
  ),
  /** day 1: how the player arrives, one to three sentences (02c §2) */
  arrival: CardText.optional(),
  /** the task of the player, told on the day the story says `{auftrag}` and readable afterwards (WP22c) */
  mission: CardText.optional(),
  mini_case: z.object({ title: z.string().min(1), text: CardText }),
  page_texts: z.array(z.object({ id: Id, text: CardText })).default([]),
});

export type Puzzle = z.infer<typeof Puzzle>;
export type Event = z.infer<typeof Event>;
export type Riddles = z.infer<typeof RiddlesFile>;
