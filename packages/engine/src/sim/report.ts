import type { LoadedCase } from '../loader';
import { makeCtx } from '../game';
import type { Category, Profile, Quality, Scoring } from '../schemas';
import { applyProfile, buildInfo } from '../solver';
import { BOTS, type BotName } from './bots';
import { simulate, type SimResult } from './run';

const CATS: Category[] = ['who', 'accomplice', 'when', 'where'];

export interface BotRun {
  bot: BotName;
  runs: SimResult[];
}

/** Runs every bot (random and the like with many seeds) on the real engine. */
export function runBots(
  full: LoadedCase,
  profile: Profile,
  scoring: Scoring,
  quality: Quality,
  opts: { bots?: BotName[]; seeds?: number } = {},
): BotRun[] {
  const c = applyProfile(full, profile);
  const ctx = makeCtx(c, profile, scoring);
  const info = buildInfo(c, profile);
  return (opts.bots ?? [...BOTS]).map((bot) => {
    const n = bot === 'random' ? (opts.seeds ?? 20) : 1;
    const runs = Array.from({ length: n }, (_, i) =>
      simulate(ctx, info, bot, i + 1, quality.reading_wpm),
    );
    return { bot, runs };
  });
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

/** Max candidates over categories, medians over seeds. */
const worstCat = (runs: SimResult[], day: number) =>
  Object.fromEntries(
    CATS.map((k) => [k, median(runs.map((r) => r.candidates[day]?.[k] ?? 0))]),
  ) as Record<Category, number>;

/** Up to 20 lines, docs/07 §4. */
export function summary(r: BotRun): string[] {
  const x = r.runs[0] as SimResult;
  const row = (day: number) => {
    const c = worstCat(r.runs, day);
    return `  Tag ${day}: Wer ${c.who} · Komplize ${c.accomplice} · Wann ${c.when} · Wo ${c.where}`;
  };
  const mind = median(r.runs.map((q) => Math.round(q.mindShare * 100)));
  return [
    `${r.bot} (${r.runs.length} Lauf/Läufe)`,
    `  eindeutig ab Tag: ${x.uniqueDay ?? 'nie'}${r.runs.length > 1 ? ' (erster Lauf)' : ''}`,
    ...[10, 17, 24].map(row),
    `  Punkte: ${median(r.runs.map((q) => q.points))} (Tag 10: ${x.pointsByDay[9]}, 17: ${x.pointsByDay[16]}, 24: ${x.pointsByDay[23]})`,
    `  Mitdenken: ${mind}% · leere Aktionen: ${median(r.runs.map((q) => q.emptyActions))} · Tage ohne Fund: ${x.idleDays.length}`,
    `  Lesezeit (längster Tag): ${x.maxMinutes.toFixed(1)} Min. · Anklage: ${x.accusedDay ?? '–'}`,
  ];
}

/** Violations of docs/07 §5; empty = the case is balanced. */
export function balanceFindings(
  runs: BotRun[],
  profile: Profile,
  q: Quality,
  latestOptimalDay: number,
): string[] {
  const out: string[] = [];
  const get = (b: BotName) => runs.find((r) => r.bot === b);
  const opt = get('optimal')?.runs[0];
  const greedy = get('greedy')?.runs[0];
  if (opt) {
    if (opt.uniqueDay === null) out.push('optimal löst nie eindeutig');
    else if (opt.uniqueDay < q.tempo.earliest_day)
      out.push(
        `optimal ist schon an Tag ${opt.uniqueDay} fertig (frühestens ${q.tempo.earliest_day})`,
      );
    else if (opt.uniqueDay > latestOptimalDay)
      out.push(`optimal erst an Tag ${opt.uniqueDay} fertig (spätestens ${latestOptimalDay})`);
  }
  if (greedy) {
    if (greedy.uniqueDay === null || greedy.uniqueDay > 24)
      out.push('greedy wird bis Tag 24 nicht eindeutig');
    if (greedy.maxMinutes > q.daily_minutes_max)
      out.push(
        `greedy braucht ${greedy.maxMinutes.toFixed(1)} Min. an einem Tag (max. ${q.daily_minutes_max})`,
      );
    if (greedy.mindShare < q.mind_share_min)
      out.push(
        `Mitdenken ${(greedy.mindShare * 100).toFixed(0)}% (min. ${q.mind_share_min * 100}%)`,
      );
  }
  const cap = (b: BotName, limit: (k: Category) => number, label: string) => {
    const r = get(b);
    if (!r) return;
    const c = worstCat(r.runs, 24);
    for (const k of CATS)
      if (c[k] > limit(k)) out.push(`${label}: ${k} ${c[k]} > ${limit(k)} an Tag 24`);
  };
  cap(
    'newspaper_only',
    (k) =>
      k === 'who'
        ? q.bots.newspaper_only_max_candidates.who
        : q.bots.newspaper_only_max_candidates.other,
    'newspaper_only',
  );
  cap('random', () => q.bots.random_median_max_candidates, 'random (Median)');
  cap('worst', () => q.bots.worst_max_candidates, 'worst');
  for (const b of ['optimal', 'greedy', 'worst'] as BotName[]) {
    const idle = get(b)?.runs[0]?.idleDays ?? [];
    if (idle.length) out.push(`${b}: keine neuen Funde an Tag ${idle.slice(0, 6).join(', ')}`);
  }
  void profile;
  return out;
}
