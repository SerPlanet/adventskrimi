import { z } from 'zod';
import type { LoadedCase } from '../loader';
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
  bonusDay,
  canAccuse,
  pocketDocument,
  canPlayDay,
  changeTheory,
  closeDay,
  readableDays,
  endDay,
  fileAccusation,
  isCandidate,
  isOnTime,
  makeCtx,
  setMark,
  answerOf,
  fileArticle,
  fileFind,
  unfile,
  setCell,
  questionHint,
  rankOf,
  readNewspaper,
  resolveAction,
  type GameCtx,
  type PlayerState,
} from '../game';
import { applyProfile } from '../solver/profile';
import { fillRole, renameCase, renderAll } from '../names';
import { generateNewspaper, namesOf } from './newspaper';
import { ApiError, Requests, type GameTx, type PlayerTx, type Settings } from './types';
import { buildView, roleOf } from './view';

/** Placeholders like {n:leitung} are always rendered, even if the stored case still has them. */
const rendered = new WeakMap<object, LoadedCase>();
function withNames(c: LoadedCase): LoadedCase {
  let r = rendered.get(c);
  if (!r) rendered.set(c, (r = renameCase(c, {})));
  return r;
}

export async function ctxOf(tx: GameTx): Promise<GameCtx> {
  const profile = tx.game.profile;
  return makeCtx(applyProfile(withNames(await tx.caseData()), profile), profile, tx.game.scoring);
}

const view = (tx: PlayerTx, ctx: GameCtx, now: Date, state = tx.player.state) =>
  buildView(tx, { ...tx.player, state }, ctx, now);

function requirePlayable(tx: PlayerTx, now: Date) {
  if (!canPlayDay(tx.player.state, now, tx.game.startDate))
    throw new ApiError('day_not_available', 403);
}

/** The paper of a day, rendered (a stored paper may still hold placeholders); made once, then stored. */
async function paperOf(tx: PlayerTx, ctx: GameCtx, day: number) {
  const existing = await tx.newspaper(day);
  if (existing) return renderAll(existing, {}, namesOf(ctx));
  const fresh = generateNewspaper(
    ctx,
    day,
    await tx.activity(day - 1),
    await tx.plaquesOnDay(day - 1),
    await tx.accusationsOnDay(day - 1),
  );
  return tx.storeNewspaper(day, fresh);
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
      // every question gets an answer, also "Dazu weiß ich nichts." (02c §6)
      const answer = result.status === 'unavailable' ? undefined : answerOf(next, ctx, req.action);
      const out =
        result.status === 'found'
          ? { status: 'found', new_items: result.newItems, points: result.points, answer }
          : { status: result.status, message: result.message, answer };
      return {
        result: fillRole(out, roleOf(ctx, tx.player.settings)),
        plaque,
        state: view(tx, ctx, now, next),
      };
    });
  },

  async end_day(tx: PlayerTx, req: Req<'end_day'>, now: Date) {
    return once(tx, req.request_id, async () => {
      requirePlayable(tx, now);
      const ctx = await ctxOf(tx);
      const r = endDay(tx.player.state, ctx, req.next_room);
      if (!r.ok) throw new ApiError(r.reason, 400);
      // the report card is booked once, from the theory at the end of that day
      const next = closeDay(r.state, ctx, tx.player.state.day);
      await tx.save(next);
      return { state: view(tx, ctx, now, next) };
    });
  },

  /** "Einstecken": a found document goes into the inventory and stays readable in full. */
  async pocket(tx: PlayerTx, req: Req<'pocket'>, now: Date) {
    const ctx = await ctxOf(tx);
    const next = pocketDocument(tx.player.state, ctx, req.source_id);
    if (!next) throw new ApiError('bad_request', 400);
    if (next !== tx.player.state) await tx.save(next);
    return { state: view(tx, ctx, now, next) };
  },

  async get_theory(tx: PlayerTx, _req: Req<'get_theory'>) {
    return { theory: tx.player.state.theory, history: tx.player.state.theoryHistory ?? [] };
  },

  /** Theory can change any time until the accusation. Needs no open day: thinking is free. */
  async set_theory(tx: PlayerTx, req: Req<'set_theory'>, now: Date) {
    const ctx = await ctxOf(tx);
    const st = tx.player.state;
    if (st.accused) throw new ApiError('already_accused', 409);
    const next = changeTheory(st, ctx, req.theory);
    if (next === 'invalid') throw new ApiError('bad_request', 400);
    if (next !== st) await tx.save(next);
    return { state: view(tx, ctx, now, next) };
  },

  /** Grid marks and timeline table cells, stored per player so devices can change. */
  async set_note(tx: PlayerTx, req: Req<'set_note'>, now: Date) {
    const ctx = await ctxOf(tx);
    const st = tx.player.state;
    const next =
      req.kind === 'grid'
        ? setMark(st, ctx, req.cat, req.candidate, req.mark)
        : setCell(st, ctx, req.window, req.room, req.persons);
    if (!next) throw new ApiError('bad_request', 400);
    await tx.save(next);
    return { state: view(tx, ctx, now, next) };
  },

  /** "In die Akte legen": a find the player has, or an article of a paper the player may read. */
  async file_add(tx: PlayerTx, req: Req<'file_add'>, now: Date) {
    const ctx = await ctxOf(tx);
    const st = tx.player.state;
    let next: PlayerState | null;
    if (req.kind === 'find') next = fileFind(st, req.id);
    else {
      if (req.day > readableDays(st, now, tx.game.startDate)) throw new ApiError('not_yet', 403);
      const article = (await paperOf(tx, ctx, req.day)).articles.find((a) => a.id === req.id);
      next = article ? fileArticle(st, article, req.day) : null;
    }
    if (!next) throw new ApiError('bad_request', 400);
    if (next !== st) await tx.save(next);
    return { state: view(tx, ctx, now, next) };
  },

  async file_remove(tx: PlayerTx, req: Req<'file_remove'>, now: Date) {
    const ctx = await ctxOf(tx);
    const next = unfile(tx.player.state, req.kind, req.id);
    if (next.filed.length !== tx.player.state.filed.length) await tx.save(next);
    return { state: view(tx, ctx, now, next) };
  },

  /** Final accusation: allowed from the early-accusation day on, final once handed in. */
  async accuse(tx: PlayerTx, req: Req<'accuse'>, now: Date) {
    return once(tx, req.request_id, async () => {
      const ctx = await ctxOf(tx);
      const st = tx.player.state;
      if (st.accused) throw new ApiError('already_accused', 409);
      if (!canAccuse(st, ctx)) throw new ApiError('too_early', 403);
      const theory = req.theory;
      const complete = (['who', 'accomplice', 'when', 'where'] as const).every(
        (k) => theory[k] && isCandidate(ctx, k, theory[k]),
      );
      const questions = ctx.c.case.proof_questions;
      const proofOk = questions.every((q) =>
        (req.proof[q.id] ?? []).every((o) => q.options.some((x) => x.id === o)),
      );
      if (!complete || !proofOk) throw new ApiError('bad_request', 400);
      // early bonus only for players who are not behind the real day
      const real = bonusDay(st, now, tx.game.startDate);
      const next = fileAccusation(st, ctx, req, st.day >= real ? real : null);
      await tx.save(next);
      return { state: view(tx, ctx, now, next) };
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
      // the puzzle of any newspaper the player may read; solved after its day it counts less
      const day = req.day ?? st.day;
      if (day > readableDays(st, now, tx.game.startDate)) throw new ApiError('bad_request', 400);
      const late = day !== bonusDay(st, now, tx.game.startDate);
      const puzzle = dailyPuzzleFor(tx.game.slug, day, dailyLevel(st, day));
      let next = st;
      let extra: Record<string, unknown> = {};
      if (req.op === 'check') {
        if (!req.answer) throw new ApiError('bad_request', 400);
        const r = submitDaily(st, ctx, puzzle, day, req.answer, late);
        next = r.state;
        extra = { outcome: r.outcome };
      } else if (req.op === 'hint') {
        const h = hintDaily(st, puzzle, day);
        if (!h) throw new ApiError('no_hint', 400);
        next = h.state;
        extra = { hint: h.text, solution: h.solution };
      } else {
        next = skipDaily(st, puzzle, day);
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
    const ctx = await ctxOf(tx);
    const role = req.settings.role;
    if (role !== undefined && role !== tx.player.settings.role) {
      if (!ctx.profile.roles.some((r) => r.id === role)) throw new ApiError('bad_request', 400);
      if (tx.player.state.day > 1) throw new ApiError('role_locked', 403);
    }
    await tx.save(tx.player.state, merged);
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
    // readable up to min(today, the day this player is playing): nobody reads ahead of their own game
    if (req.day > readableDays(tx.player.state, now, tx.game.startDate))
      throw new ApiError('not_yet', 403);
    return { newspaper: await paperOf(tx, await ctxOf(tx), req.day) };
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
  'set_theory',
  'set_note',
  'file_add',
  'file_remove',
  'pocket',
  'accuse',
];
