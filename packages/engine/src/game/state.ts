import type { LoadedCase } from '../loader';
import type { Category, Profile, Scoring } from '../schemas';
import { buildReach, type Reach } from '../solver/reach';

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
}

/** Everything the engine knows about one player. Plain data, no I/O. */
export interface PlayerState {
  /** day being played; 25 = all days finished */
  day: number;
  room: string;
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
  };
}

export function budgetFor(profile: Profile, day: number): number {
  const prolog = profile.actions_per_day.prolog as Record<number, number>;
  return prolog[day] ?? profile.actions_per_day.default;
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
