import type { Category } from '../schemas';
import { accuse, reportCard, setTheory, type Accusation } from './points';
import type { GameCtx, PlayerState } from './state';

const CATS: Category[] = ['who', 'accomplice', 'when', 'where'];
const HISTORY_MAX = 60;

/** Day of the player from which the accusation may be handed in (early accusation or the last day). */
export const accusationFromDay = (ctx: GameCtx): number =>
  ctx.profile.early_accusation ? ctx.profile.early_accusation_from_day : 24;

export const canAccuse = (st: PlayerState, ctx: GameCtx): boolean =>
  !st.accused && st.day >= accusationFromDay(ctx);

/** Valid candidate for the category? */
export const isCandidate = (ctx: GameCtx, cat: Category, id: string): boolean =>
  !!ctx.c.case.categories[cat]?.includes(id);

/** Applies a theory change (null clears a field) and records it in the history. */
export function changeTheory(
  st: PlayerState,
  ctx: GameCtx,
  patch: Partial<Record<Category, string | null>>,
): PlayerState | 'invalid' {
  let next = st;
  for (const cat of CATS) {
    const v = patch[cat];
    if (v === undefined) continue;
    if (v !== null && !isCandidate(ctx, cat, v)) return 'invalid';
    next = setTheory(next, cat, v ?? undefined);
  }
  if (JSON.stringify(next.theory) === JSON.stringify(st.theory)) return st;
  const history = [...(st.theoryHistory ?? []), { day: st.day, theory: next.theory }];
  return { ...next, theoryHistory: history.slice(-HISTORY_MAX) };
}

/** Plain-language sentence of the inspector; says how many are right, never which. */
const SENTENCES = [
  'Noch läuft nichts zusammen. Schau dir die Spuren in Ruhe noch einmal an.',
  'Ein erster Punkt sitzt. Der Rest braucht noch Beweise.',
  'Die Hälfte steht. Prüfe, was du nur auf Aussagen stützt.',
  'Das sieht schon sehr gut aus. Eine Sache passt noch nicht.',
  'Alles stimmt. Prüfe trotzdem, ob du es auch beweisen kannst.',
];
export const inspectorSentence = (right: number): string =>
  SENTENCES[Math.max(0, Math.min(4, right))] ?? '';

/** Called when a day ends: books the report card once from the theory of that moment. */
export function closeDay(st: PlayerState, ctx: GameCtx, day: number): PlayerState {
  if (!ctx.scoring.report_card.days.includes(day) || st.reports?.[day] !== undefined) return st;
  const r = reportCard(st, ctx, day);
  return { ...r.state, reports: { ...st.reports, [day]: r.correct.length } };
}

/** Hands in the accusation; the verdict is kept for the resolution screen. */
export function fileAccusation(
  st: PlayerState,
  ctx: GameCtx,
  acc: Accusation,
  earlyDay: number | null,
): PlayerState {
  const r = accuse(st, ctx, acc, earlyDay);
  if (r.state === st) return st;
  return {
    ...r.state,
    accusedDay: st.day,
    verdict: { correct: r.correct, proofCorrect: r.proofCorrect },
    theoryHistory: [...(st.theoryHistory ?? []), { day: st.day, theory: acc.theory }].slice(
      -HISTORY_MAX,
    ),
  };
}

/** The story, in chapters, plus the true answer by name. Only built for players who may see it. */
export function resolutionOf(ctx: GameCtx, st: PlayerState) {
  const sol = ctx.c.case.solution as Record<Category, string>;
  const name = (cat: Category, id: string) =>
    cat === 'when'
      ? (ctx.c.case.windows.find((w) => w.id === id)?.label ?? id)
      : cat === 'where'
        ? (ctx.c.rooms.rooms.find((r) => r.id === id)?.name ?? id)
        : (ctx.c.npcs.npcs.find((n) => n.id === id)?.name ?? id);
  return {
    chapters: ctx.c.world.crime.steps,
    solution: CATS.map((cat) => ({
      cat,
      answer: name(cat, sol[cat]),
      yours: st.theory[cat] === undefined ? null : name(cat, st.theory[cat] as string),
      right: st.verdict?.correct.includes(cat) ?? false,
    })),
    proof: ctx.c.case.proof_questions.map((q) => ({
      id: q.id,
      text: q.text,
      correct: q.correct.map((id) => q.options.find((o) => o.id === id)?.text ?? id),
      right: st.verdict?.proofCorrect.includes(q.id) ?? false,
    })),
  };
}
