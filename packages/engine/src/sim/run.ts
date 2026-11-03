import {
  answerQuestion,
  closeDay,
  endDay,
  fileAccusation,
  newPlayer,
  questionOfDay,
  readNewspaper,
  resolveAction,
  solvePuzzle,
  submitDaily,
  totalPoints,
  changeTheory,
  type GameCtx,
  type PlayerState,
} from '../game';
import { dailyPuzzleFor } from '../game/dailypuzzle';
import type { Category } from '../schemas';
import { buildInfo, combine, count, reachableItems, remaining, type Info } from '../solver';
import { planDay, chooseRoom, makeRng, type BotName, type Rng } from './bots';

const CATS: Category[] = ['who', 'accomplice', 'when', 'where'];
const MIND = [
  'question',
  'puzzle',
  'mini_case',
  'report_card',
  'finale',
  'proof',
  'early_accusation',
];
const WATCH_DAYS = [10, 17, 24];

export interface SimResult {
  bot: BotName;
  seed: number;
  /** first day after which exactly one tuple is left (null = never) */
  uniqueDay: number | null;
  /** candidates per category at the end of day 10/17/24 */
  candidates: Record<number, Record<Category, number>>;
  points: number;
  pointsByDay: number[];
  mindShare: number;
  emptyActions: number;
  /** days (1..24) without any new find although something was left to find */
  idleDays: number[];
  /** reading load of the busiest day in minutes */
  maxMinutes: number;
  accusedDay: number | null;
  /** the player after the last simulated day */
  state: PlayerState;
}

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

/** Plays one player through days 1..24 with the real engine. No DB, no clock. */
export function simulate(
  ctx: GameCtx,
  info: Info,
  bot: BotName,
  seed: number,
  wpm: number,
  salt = 'sim',
  /** continue a saved player and stop when day `until` begins (staging fast-forward) */
  from?: { state: PlayerState; until: number },
): SimResult {
  const rng: Rng = makeRng(seed);
  let st: PlayerState = from?.state ?? newPlayer(ctx);
  const res: SimResult = {
    bot,
    seed,
    uniqueDay: null,
    candidates: {},
    points: 0,
    pointsByDay: [],
    mindShare: 0,
    emptyActions: 0,
    idleDays: [],
    maxMinutes: 0,
    accusedDay: null,
    state: st,
  };

  for (let day = st.day; day <= Math.min(24, (from?.until ?? 25) - 1); day++) {
    const foundBefore = st.found.length;
    st = readNewspaper(st, ctx).state;

    // object puzzles in the room are free; every bot but the two "careless" ones solves them
    if (bot !== 'random' && bot !== 'casual' && bot !== 'newspaper_only')
      for (const p of ctx.c.puzzles.puzzles)
        if (p.room === st.room) st = solvePuzzle(st, ctx, p.id, p.answer).state;

    const q = questionOfDay(ctx, day);
    if (q) {
      const pick =
        bot === 'random' || bot === 'casual' ? (q.options[0]?.id ?? q.correct) : q.correct;
      st = answerQuestion(st, ctx, pick).state;
    }
    if (bot === 'optimal' || bot === 'greedy') {
      const p = dailyPuzzleFor(salt, day, 'medium');
      st = submitDaily(st, ctx, p, p.answer).state;
    }

    // things can unlock further things (item, then use it), so the careful bots go round again
    const rounds = bot === 'greedy' || bot === 'optimal' ? 6 : 1;
    for (let round = 0; round < rounds; round++) {
      const todo = planDay(bot, st, ctx, info, rng);
      if (!todo.length) break;
      let gained = false;
      for (const a of todo) {
        const r = resolveAction(st, ctx, a);
        st = r.state;
        if (r.result.status === 'found') gained = true;
        else if (r.result.status !== 'budget') res.emptyActions++;
      }
      if (!gained) break;
    }
    const everything = [...reachableItems(info)].every((i) => st.found.includes(i));
    if (
      !everything &&
      st.found.length === foundBefore &&
      !ctx.reach.blocked(st.room, day) &&
      bot !== 'newspaper_only'
    )
      res.idleDays.push(day);

    // reading load: texts of everything found today plus the question
    const todays = st.found.slice(foundBefore);
    const text = [
      ...todays.map(
        (id) =>
          ctx.c.facts.facts.find((f) => f.id === id)?.text ??
          ctx.c.statements.statements.find((s) => s.id === id)?.text ??
          '',
      ),
      q?.text ?? '',
    ].join(' ');
    res.maxMinutes = Math.max(res.maxMinutes, words(text) / wpm);

    // the bot's best guess: a surviving candidate per category
    const left = remaining(info.space, combine(info, st.found));
    const total = count(combine(info, st.found));
    if (res.uniqueDay === null && total === 1) res.uniqueDay = day;
    if (WATCH_DAYS.includes(day))
      res.candidates[day] = Object.fromEntries(CATS.map((k) => [k, left[k].length])) as Record<
        Category,
        number
      >;
    if (bot !== 'newspaper_only' || day >= 10) {
      const guess = Object.fromEntries(
        CATS.map((k) => [k, left[k][Math.floor(rng() * left[k].length)] ?? null]),
      );
      const t = changeTheory(st, ctx, guess);
      if (t !== 'invalid') st = t;
    }

    // accusation: optimal as soon as it is certain (early), everybody else on the last day
    const certain = total === 1;
    if (!st.accused && ((bot === 'optimal' && certain && day >= 20) || day === 24)) {
      const proof = certain
        ? Object.fromEntries(ctx.c.case.proof_questions.map((p) => [p.id, p.correct]))
        : {};
      const early = day < 24 ? day : null;
      st = fileAccusation(st, ctx, { theory: st.theory, proof }, early);
      res.accusedDay = day;
    }

    res.pointsByDay.push(totalPoints(st));
    const ended = endDay(st, ctx, chooseRoom(bot, st, ctx, info, rng));
    st = closeDay(ended.ok ? ended.state : { ...st, day: day + 1 }, ctx, day);
  }

  res.state = st;
  res.points = totalPoints(st);
  const mind = st.ledger.filter((l) => MIND.includes(l.kind)).reduce((a, l) => a + l.points, 0);
  res.mindShare = res.points ? mind / res.points : 0;
  return res;
}

export { buildInfo };
