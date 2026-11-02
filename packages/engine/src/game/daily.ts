import type { Question } from '../schemas';
import { awardQuestion } from './points';
import type { GameCtx, PlayerState, QuestionProgress } from './state';

export const MAX_QUESTION_ATTEMPTS = 2;

export type QuestionOutcome =
  | { status: 'correct' | 'wrong' | 'failed'; attemptsLeft: number; hint?: string }
  | { status: 'already_done' | 'no_question' };

export const questionOfDay = (ctx: GameCtx, day: number): Question | undefined =>
  ctx.c.questions.questions.find((q) => q.day === day);

const fresh = (): QuestionProgress => ({ attempts: 0, done: false, correct: false, hint: false });

/** Asks for the tip. The tip halves the points of this one question (rounded down). */
export function questionHint(
  st: PlayerState,
  ctx: GameCtx,
): { state: PlayerState; hint: string } | null {
  const q = questionOfDay(ctx, st.day);
  if (!q?.hint) return null;
  const p = st.questions[st.day] ?? fresh();
  if (p.done) return null;
  return {
    state: { ...st, questions: { ...st.questions, [st.day]: { ...p, hint: true } } },
    hint: q.hint,
  };
}

/** Two tries. Right = points (halved after a tip), wrong = 0; nothing is ever deducted. */
export function answerQuestion(
  st: PlayerState,
  ctx: GameCtx,
  optionId: string,
): { state: PlayerState; outcome: QuestionOutcome } {
  const q = questionOfDay(ctx, st.day);
  if (!q) return { state: st, outcome: { status: 'no_question' } };
  const p = st.questions[st.day] ?? fresh();
  if (p.done) return { state: st, outcome: { status: 'already_done' } };
  const attempts = p.attempts + 1;
  const correct = optionId === q.correct;
  const done = correct || attempts >= MAX_QUESTION_ATTEMPTS;
  let next: PlayerState = {
    ...st,
    questions: { ...st.questions, [st.day]: { ...p, attempts, done, correct } },
  };
  if (done) next = awardQuestion(next, ctx, correct, p.hint);
  const attemptsLeft = MAX_QUESTION_ATTEMPTS - attempts;
  const status = correct ? 'correct' : done ? 'failed' : 'wrong';
  return { state: next, outcome: { status, attemptsLeft } };
}
