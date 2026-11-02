import { z } from 'zod';
import type { LoadedCase } from '../loader';
import { Id, type Profile, type Scoring } from '../schemas';
import type { PlayerState } from '../game/state';

export const SettingsSchema = z
  .object({
    font_size: z.enum(['normal', 'large', 'xl']),
    note_level: z.enum(['auto', 'half', 'manual']),
    puzzle_level: z.enum(['easy', 'medium', 'hard']),
    explanations: z.boolean(),
    dark_mode: z.enum(['auto', 'light', 'dark']),
  })
  .partial()
  .strict();
export type Settings = z.infer<typeof SettingsSchema>;

export interface GameRecord {
  id: string;
  /** link slug: the game is chosen by /#/<slug> */
  slug: string;
  name: string;
  caseId: string;
  startDate: string;
  profile: Profile;
  scoring: Scoring;
}

export interface PlayerRecord {
  id: string;
  gameId: string;
  name: string;
  avatar: string | null;
  isDuo: boolean;
  settings: Settings;
  state: PlayerState;
}

export interface DayActivity {
  playerId: string;
  name: string;
  room: string | null;
  points: number;
}

export interface NewspaperContent {
  day: number;
  headline: string;
  text: string;
  weather?: string;
  blocked_rooms: string[];
  bonus_rooms: string[];
  gossip: string[];
  ads: string[];
  filler: string[];
  rumors: string[];
  plaques: { title: string; player: string }[];
  detective_of_day: { name: string; points: number } | null;
}

export interface ScoreRow {
  playerId: string;
  name: string;
  avatar: string | null;
  points: number;
  plaques: number;
}

/** Read access to one game. Everything the handlers need beyond the player itself. */
export interface GameTx {
  game: GameRecord;
  caseData(): Promise<LoadedCase>;
  activity(day: number): Promise<DayActivity[]>;
  plaquesOnDay(day: number): Promise<{ title: string; player: string }[]>;
  scoreboard(): Promise<ScoreRow[]>;
  newspaper(day: number): Promise<NewspaperContent | undefined>;
  /** Insert once; on a race the first writer wins and its content is returned. */
  storeNewspaper(day: number, content: NewspaperContent): Promise<NewspaperContent>;
}

export interface PlayerTx extends GameTx {
  player: PlayerRecord;
  /** response stored for an earlier request with the same id, if any */
  saved(requestId: string): Promise<unknown | undefined>;
  remember(requestId: string, response: unknown): Promise<void>;
  /** persists the state (and derived rows: ledger, discoveries, days, ...) */
  save(next: PlayerState, settings?: Settings): Promise<void>;
  /** unique insert: true only for the first discoverer of the source */
  tryPlaque(sourceId: string, title: string): Promise<boolean>;
}

export interface Store {
  /** Runs fn in a transaction. With lock the player row is held, so requests serialize per player. */
  transaction<T>(
    playerId: string,
    fn: (tx: PlayerTx) => Promise<T>,
    opts?: { lock: boolean; slug?: string },
  ): Promise<T>;
  game<T>(gameId: string, fn: (tx: GameTx) => Promise<T>): Promise<T>;
  gameBySlug(slug: string): Promise<{ id: string; name: string; profile: string } | undefined>;
  listPlayers(gameId: string): Promise<PlayerRecord[]>;
  createPlayer(
    gameId: string,
    p: { name: string; avatar: string | null; isDuo: boolean; state: PlayerState },
  ): Promise<PlayerRecord>;
  updatePlayer(
    playerId: string,
    patch: { name?: string; avatar?: string | null; isDuo?: boolean },
  ): Promise<PlayerRecord | undefined>;
}

// ---- requests ----
const RequestId = z.string().min(8).max(64);
const PlayerId = z.string().min(1).max(64);
/** Every player request names its game by link slug; it must match the player's game. */
const Slug = z.string().regex(/^[a-z0-9-]{2,40}$/);

export const ActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('talk'), npc: Id, topic: Id }),
  z.object({ type: z.literal('inspect'), object: Id }),
  z.object({ type: z.literal('use'), item: Id, target: Id }),
  z.object({ type: z.literal('hotelbook') }),
]);

export const Requests = {
  state: z.object({ slug: Slug, player_id: PlayerId }),
  open_day: z.object({ slug: Slug, player_id: PlayerId }),
  act: z.object({ slug: Slug, player_id: PlayerId, request_id: RequestId, action: ActionSchema }),
  end_day: z.object({
    slug: Slug,
    player_id: PlayerId,
    request_id: RequestId,
    next_room: Id.optional(),
  }),
  answer_daily: z.object({
    slug: Slug,
    player_id: PlayerId,
    request_id: RequestId,
    option_id: Id.optional(),
    hint: z.boolean().optional(),
  }),
  daily_puzzle: z.object({
    slug: Slug,
    player_id: PlayerId,
    request_id: RequestId,
    op: z.enum(['check', 'hint', 'skip']),
    answer: z.string().max(200).optional(),
  }),
  object_puzzle: z.object({
    slug: Slug,
    player_id: PlayerId,
    request_id: RequestId,
    puzzle_id: Id,
    op: z.enum(['check', 'hint']),
    answer: z.string().max(200).optional(),
  }),
  scoreboard: z.object({ slug: Slug, player_id: PlayerId }),
  newspaper: z.object({ slug: Slug, player_id: PlayerId, day: z.number().int().min(1).max(24) }),
  settings: z.object({ slug: Slug, player_id: PlayerId, settings: SettingsSchema }),
} as const;

export class ApiError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
