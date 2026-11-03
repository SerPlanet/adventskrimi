import type { LoadedCase } from '../loader';
import type { Category, Profile, Scoring } from '../schemas';
import { buildReach, type Reach } from '../solver/reach';
import type { FiledEntry } from './file';

export interface LedgerEntry {
  kind: string;
  ref: string;
  points: number;
  day: number | null;
}

export interface Discovery {
  sourceId: string;
  itemIds: string[];
  day: number;
}

export interface QuestionProgress {
  attempts: number;
  done: boolean;
  correct: boolean;
  hint: boolean;
}

export interface DailyProgress {
  level: 'easy' | 'medium' | 'hard';
  attempts: number;
  /** tips used: 1, 2, then 3 = solution shown */
  hints: number;
  solved: boolean;
  done: boolean;
}

export interface PuzzleProgress {
  attempts: number;
  hints: number;
  solved: boolean;
  /** the player tried the lock: its puzzle is now shown on the thing */
  seen?: boolean;
}

/** Everything the engine knows about one player. Plain data, no I/O. */
export interface PlayerState {
  /** day being played; 25 = all days finished */
  day: number;
  room: string;
  /** the room left when the last day ended (narrative, 02c §2) */
  prevRoom?: string;
  /** "Genauer untersuchen" used today (budget: game/budget.ts), reset when the day ends */
  actionsUsed: number;
  /** player did something that counts as "played" on the current day */
  started: boolean;
  found: string[];
  discoveries: Discovery[];
  inventory: string[];
  puzzles: Record<string, PuzzleProgress>;
  theory: Partial<Record<Category, string>>;
  ledger: LedgerEntry[];
  finishedDays: number[];
  /** final accusation handed in: theory is locked */
  accused: boolean;
  /** question of the day progress by day */
  questions: Record<number, QuestionProgress>;
  /** puzzle of the day progress by day */
  daily: Record<number, DailyProgress>;
  /** grid marks by "category:candidate" */
  grid: Record<string, 'yes' | 'no'>;
  /** timeline table: "window|room" -> the people the player put there (02c §8) */
  table: Record<string, string[]>;
  /** what the player put into the dossier (02c §7) */
  filed: FiledEntry[];
  /** every saved change of the theory, newest last */
  theoryHistory?: { day: number; theory: Partial<Record<Category, string>> }[];
  /** report card by day: how many categories were right (details stay private) */
  reports?: Record<number, number>;
  /** documents the player put in the pocket (source ids), readable again in full */
  pocket?: string[];
  /** the player's own day on which the accusation was handed in */
  accusedDay?: number;
  /** result of the accusation, shown only together with the resolution */
  verdict?: { correct: Category[]; proofCorrect: string[] };
}

/** Immutable game inputs for a (profile-applied) case. */
export interface GameCtx {
  c: LoadedCase;
  profile: Profile;
  scoring: Scoring;
  reach: Reach;
}

export function makeCtx(c: LoadedCase, profile: Profile, scoring: Scoring): GameCtx {
  return { c, profile, scoring, reach: buildReach(c, profile) };
}

/** Day 1 starts in the lobby if the case has one, else in the first room. */
export function newPlayer(ctx: GameCtx): PlayerState {
  const rooms = ctx.c.rooms.rooms;
  const start = rooms.find((r) => r.id === 'lobby') ?? rooms[0];
  return {
    day: 1,
    room: start?.id ?? '',
    actionsUsed: 0,
    started: false,
    found: [],
    discoveries: [],
    inventory: [],
    puzzles: {},
    theory: {},
    ledger: [],
    finishedDays: [],
    accused: false,
    questions: {},
    daily: {},
    grid: {},
    table: {},
    filed: [],
  };
}

/** Appends a ledger entry. Idempotent per (kind, ref); points are never negative. */
export function addLedger(st: PlayerState, e: LedgerEntry): PlayerState {
  if (e.points <= 0 || st.ledger.some((l) => l.kind === e.kind && l.ref === e.ref)) return st;
  return { ...st, ledger: [...st.ledger, e] };
}

export const totalPoints = (st: PlayerState): number => st.ledger.reduce((a, l) => a + l.points, 0);

/** Highest rank whose threshold is reached. */
export function rankOf(points: number, scoring: Scoring): string {
  const sorted = [...scoring.ranks].sort((a, b) => a.min_points - b.min_points);
  let name = sorted[0]?.name ?? '';
  for (const r of sorted) if (points >= r.min_points) name = r.name;
  return name;
}

/** A tip halves the points of that one item (rounded down). */
export const withTip = (points: number, scoring: Scoring): number =>
  Math.floor(points / scoring.hint_divisor);
