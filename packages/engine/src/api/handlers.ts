import { z } from 'zod';
import {
  answerQuestion,
  dailyLevel,
  dailyPuzzleFor,
  hintDaily,
  puzzleHint,
  skipDaily,
  solvePuzzle,
  submitDaily,
  awardPlaque,
  canPlayDay,
  dayOf,
  endDay,
  isOnTime,
  makeCtx,
  questionHint,
  rankOf,
  readNewspaper,
  resolveAction,
  type GameCtx,
} from '../game';
import { applyProfile } from '../solver/profile';
import { generateNewspaper } from './newspaper';
import { ApiError, Requests, type GameTx, type PlayerTx, type Settings } from './types';
import { buildView } from './view';

export async function ctxOf(tx: GameTx): Promise<GameCtx> {
  const profile = tx.game.profile;
  return makeCtx(applyProfile(await tx.caseData(), profile), profile, tx.game.scoring);
}

const view = (tx: PlayerTx, ctx: GameCtx, now: Date, state = tx.player.state) =>
  buildView(tx, { ...tx.player, state }, ctx, now);

function requirePlayable(tx: PlayerTx, now: Date) {
  if (!canPlayDay(tx.player.state, now, tx.game.startDate))
    throw new ApiError('day_not_available', 403);
}

/** Replays the stored response for a repeated request_id; otherwise runs fn and stores its response. */
async function once<T>(tx: PlayerTx, requestId: string, fn: () => Promise<T>): Promise<T> {
  const prior = await tx.saved(requestId);
  if (prior !== undefined) return prior as T;
  const out = await fn();
  await tx.remember(requestId, out);
  return out;
}

type Req<K extends keyof typeof Requests> = z.infer<(typeof Requests)[K]>;

export const handlers = {
  async state(tx: PlayerTx, _req: Req<'state'>, now: Date) {
    return { state: view(tx, await ctxOf(tx), now) };
  },

  /** Opening a day reads the newspaper (free finds). Safe to call repeatedly. */
  async open_day(tx: PlayerTx, _req: Req<'open_day'>, now: Date) {
    const ctx = await ctxOf(tx);
    let st = tx.player.state;
    if (canPlayDay(st, now, tx.game.startDate)) {
      const r = readNewspaper(st, ctx);
      if (r.newItems.length) {
        st = r.state;
        await tx.save(st);
      }
    }
    return { state: view(tx, ctx, now, st) };
  },

  async act(tx: PlayerTx, req: Req<'act'>, now: Date) {
    return once(tx, req.request_id, async () => {
      requirePlayable(tx, now);
      const ctx = await ctxOf(tx);
      const { state, result } = resolveAction(tx.player.state, ctx, req.action);
      let next = state;
      let plaque: string | null = null;
      if (result.status === 'found') {
        for (const p of result.plaques) {
          // first discoverer: only players on time, decided by a unique insert
          if (isOnTime(next, now, tx.game.startDate) && (await tx.tryPlaque(p.sourceId, p.title))) {
            next = awardPlaque(next, ctx, p.sourceId);
            plaque = p.title;
          }
        }
      }
      if (next !== tx.player.state) await tx.save(next);
      const out =
        result.status === 'found'
          ? { status: 'found', new_items: result.newItems, points: result.points }
          : { status: result.status, message: result.message };
      return { result: out, plaque, state: view(tx, ctx, now, next) };
    });
  },

  async end_day(tx: PlayerTx, req: Req<'end_day'>, now: Date) {
    return once(tx, req.request_id, async () => {
      requirePlayable(tx, now);
      const ctx = await ctxOf(tx);
      const r = endDay(tx.player.state, ctx, req.next_room);
      if (!r.ok) throw new ApiError(r.reason, 400);
      await tx.save(r.state);
      return { state: view(tx, ctx, now, r.state) };
    });
  },

  async answer_daily(tx: PlayerTx, req: Req<'answer_daily'>, now: Date) {
    return once(tx, req.request_id, async () => {
      requirePlayable(tx, now);
      const ctx = await ctxOf(tx);
      const st = tx.player.state;
      if (req.hint) {
        const h = questionHint(st, ctx);
        if (!h) throw new ApiError('no_hint', 400);
        await tx.save(h.state);
        return { hint: h.hint, state: view(tx, ctx, now, h.state) };
      }
      if (!req.option_id) throw new ApiError('bad_request', 400);
      const { state, outcome } = answerQuestion(st, ctx, req.option_id);
      if (state !== st) await tx.save(state);
      return { outcome, state: view(tx, ctx, now, state) };
    });
  },

  /** Puzzle of the day: check an answer, ask for a tip (tip 1, tip 2, solution) or skip. */
  async daily_puzzle(tx: PlayerTx, req: Req<'daily_puzzle'>, now: Date) {
    return once(tx, req.request_id, async () => {
      requirePlayable(tx, now);
      const ctx = await ctxOf(tx);
      const st = tx.player.state;
      const level = dailyLevel(st, ctx, tx.player.settings.puzzle_level);
      const puzzle = dailyPuzzleFor(tx.game.slug, st.day, level);
      let next = st;
      let extra: Record<string, unknown> = {};
      if (req.op === 'check') {
        if (!req.answer) throw new ApiError('bad_request', 400);
        const r = submitDaily(st, ctx, puzzle, req.answer);
        next = r.state;
        extra = { outcome: r.outcome };
      } else if (req.op === 'hint') {
        const h = hintDaily(st, puzzle);
        if (!h) throw new ApiError('no_hint', 400);
        next = h.state;
        extra = { hint: h.text, solution: h.solution };
      } else {
        next = skipDaily(st, puzzle);
      }
      if (next !== st) await tx.save(next);
      return { ...extra, state: view(tx, ctx, now, next) };
    });
  },

  /** Object puzzle in the current room: lock in front of a source. Wrong answers are free. */
  async object_puzzle(tx: PlayerTx, req: Req<'object_puzzle'>, now: Date) {
    return once(tx, req.request_id, async () => {
      requirePlayable(tx, now);
      const ctx = await ctxOf(tx);
      const st = tx.player.state;
      let next = st;
      let extra: Record<string, unknown> = {};
      if (req.op === 'check') {
        if (!req.answer) throw new ApiError('bad_request', 400);
        const r = solvePuzzle(st, ctx, req.puzzle_id, req.answer);
        next = r.state;
        extra = { correct: r.correct };
      } else {
        const h = puzzleHint(st, ctx, req.puzzle_id);
        if (!h || st.puzzles[req.puzzle_id]?.solved) throw new ApiError('no_hint', 400);
        next = h.state;
        extra = { hint: h.text };
      }
      if (next !== st) await tx.save(next);
      return { ...extra, state: view(tx, ctx, now, next) };
    });
  },

  async settings(tx: PlayerTx, req: Req<'settings'>, now: Date) {
    const merged: Settings = { ...tx.player.settings, ...req.settings };
    await tx.save(tx.player.state, merged);
    const ctx = await ctxOf(tx);
    return { state: buildView(tx, { ...tx.player, settings: merged }, ctx, now) };
  },

  async scoreboard(tx: PlayerTx, _req: Req<'scoreboard'>) {
    const ranks = tx.game.scoring;
    const rows = (await tx.scoreboard())
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((r) => ({
        name: r.name,
        avatar: r.avatar,
        points: r.points,
        plaques: r.plaques,
        plaque_titles: r.plaqueTitles,
        rank: rankOf(r.points, ranks),
        is_you: r.playerId === tx.player.id,
      }));
    return { rows };
  },

  async newspaper(tx: PlayerTx, req: Req<'newspaper'>, now: Date) {
    if (req.day > dayOf(now, tx.game.startDate)) throw new ApiError('not_yet', 403);
    const existing = await tx.newspaper(req.day);
    if (existing) return { newspaper: existing };
    const ctx = await ctxOf(tx);
    const fresh = generateNewspaper(
      ctx,
      req.day,
      await tx.activity(req.day - 1),
      await tx.plaquesOnDay(req.day - 1),
    );
    return { newspaper: await tx.storeNewspaper(req.day, fresh) };
  },
};

export type HandlerName = keyof typeof handlers;
export const MUTATING: HandlerName[] = [
  'open_day',
  'act',
  'end_day',
  'answer_daily',
  'daily_puzzle',
  'object_puzzle',
  'settings',
];
