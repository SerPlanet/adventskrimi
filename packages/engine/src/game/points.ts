import type { Category } from '../schemas';
import { addLedger, withTip, type GameCtx, type PlayerState } from './state';

const CATS: Category[] = ['who', 'accomplice', 'when', 'where'];

const played = (st: PlayerState, ctx: GameCtx): PlayerState =>
  addLedger(
    { ...st, started: true },
    { kind: 'day_played', ref: String(st.day), points: ctx.scoring.day.played, day: st.day },
  );

/** Question of the day: right = full, right with tip = halved, wrong = 0 (never negative). */
export function awardQuestion(
  st: PlayerState,
  ctx: GameCtx,
  correct: boolean,
  hintUsed: boolean,
): PlayerState {
  const base = ctx.scoring.day;
  const pts = !correct ? 0 : hintUsed ? withTip(base.question, ctx.scoring) : base.question;
  return addLedger(played(st, ctx), {
    kind: 'question',
    ref: String(st.day),
    points: pts,
    day: st.day,
  });
}

/** Puzzle of the day: skipping gives 0 and costs nothing. */
export function awardDailyPuzzle(
  st: PlayerState,
  ctx: GameCtx,
  solved: boolean,
  hintUsed: boolean,
): PlayerState {
  const base = ctx.scoring.day;
  const pts = !solved ? 0 : hintUsed ? withTip(base.puzzle, ctx.scoring) : base.puzzle;
  return addLedger(st, { kind: 'puzzle', ref: String(st.day), points: pts, day: st.day });
}

export const awardMiniCase = (st: PlayerState, ctx: GameCtx): PlayerState =>
  addLedger(st, {
    kind: 'mini_case',
    ref: 'prolog',
    points: ctx.scoring.prolog_mini_case,
    day: st.day,
  });

/** The server decides who is first (unique insert); this only books the points. */
export const awardPlaque = (st: PlayerState, ctx: GameCtx, sourceId: string): PlayerState =>
  addLedger(st, {
    kind: 'plaque',
    ref: sourceId,
    points: ctx.scoring.first_discoverer,
    day: st.day,
  });

/** Theory can change any time until the accusation is handed in. */
export function setTheory(st: PlayerState, cat: Category, value: string | undefined): PlayerState {
  if (st.accused) return st;
  const theory = { ...st.theory };
  if (value === undefined) delete theory[cat];
  else theory[cat] = value;
  return { ...st, theory };
}

const solutionOf = (ctx: GameCtx) => ctx.c.case.solution as Record<Category, string>;
const correctCats = (theory: Partial<Record<Category, string>>, ctx: GameCtx) =>
  CATS.filter((k) => theory[k] !== undefined && theory[k] === solutionOf(ctx)[k]);

/** Weekly report card from the theory snapshot: points per right category, details stay private. */
export function reportCard(
  st: PlayerState,
  ctx: GameCtx,
  day: number,
): { state: PlayerState; correct: Category[] } {
  if (!ctx.scoring.report_card.days.includes(day)) return { state: st, correct: [] };
  const correct = correctCats(st.theory, ctx);
  let next = st;
  for (const k of correct)
    next = addLedger(next, {
      kind: 'report_card',
      ref: `${day}:${k}`,
      points: ctx.scoring.report_card.per_category,
      day,
    });
  return { state: next, correct };
}

export interface Accusation {
  theory: Partial<Record<Category, string>>;
  /** proof question id -> chosen option ids */
  proof: Record<string, string[]>;
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

/**
 * Hands in the accusation. `earlyDay` = real-time day if the accusation is early AND on time
 * (caller decides via isOnTime); null = no early bonus (day 24, catch-up, or switch off).
 */
export function accuse(
  st: PlayerState,
  ctx: GameCtx,
  acc: Accusation,
  earlyDay: number | null,
): { state: PlayerState; correct: Category[]; proofCorrect: string[] } {
  if (st.accused) return { state: st, correct: [], proofCorrect: [] };
  const correct = correctCats(acc.theory, ctx);
  const fin = ctx.scoring.finale;
  let next: PlayerState = { ...st, theory: acc.theory, accused: true };
  for (const k of correct)
    next = addLedger(next, { kind: 'finale', ref: k, points: fin[k], day: st.day });
  const proofCorrect = ctx.c.case.proof_questions
    .filter((q) => sameSet(acc.proof[q.id] ?? [], q.correct))
    .map((q) => q.id);
  for (const id of proofCorrect)
    next = addLedger(next, { kind: 'proof', ref: id, points: fin.proof, day: st.day });

  const ea = ctx.scoring.early_accusation;
  if (
    earlyDay !== null &&
    ctx.profile.early_accusation &&
    earlyDay >= ctx.profile.early_accusation_from_day &&
    earlyDay < ea.last_day
  ) {
    const bonus = Math.floor(ea.factor * (ea.last_day - earlyDay) * (correct.length / CATS.length));
    next = addLedger(next, {
      kind: 'early_accusation',
      ref: 'bonus',
      points: bonus,
      day: earlyDay,
    });
  }
  return { state: next, correct, proofCorrect };
}
