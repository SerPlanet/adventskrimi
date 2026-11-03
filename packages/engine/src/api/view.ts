import {
  accusationFromDay,
  exploreProgress,
  linksOf,
  canAccuse,
  inspectorSentence,
  notesOf,
  resolutionOf,
  dailyLevel,
  dailyPuzzleFor,
  dailyView,
  canPlayDay,
  dayOf,
  nextRooms,
  questionOfDay,
  rankOf,
  totalPoints,
  type GameCtx,
  type PlayerState,
} from '../game';
import type { FactBody } from '../schemas';
import type { GameTx, PlayerRecord } from './types';

/**
 * The only shape a client ever sees. It is built from what the player has unlocked:
 * never the solution, never `truth` of a statement, never future days or locked sources.
 */
export function buildView(tx: GameTx, player: PlayerRecord, ctx: GameCtx, now: Date) {
  const st: PlayerState = player.state;
  const { c, scoring } = ctx;
  const startDate = tx.game.startDate;
  const today = dayOf(now, startDate);
  const roomName = (id?: string) => c.rooms.rooms.find((r) => r.id === id)?.name;
  const npcName = (id?: string) => c.npcs.npcs.find((n) => n.id === id)?.name;

  const finds = st.discoveries.flatMap((d) => {
    const src = c.sources.sources.find((s) => s.id === d.sourceId);
    const source = {
      id: d.sourceId,
      presentation: src?.presentation,
      lines: src?.lines,
      note: src?.note,
      document: src?.document,
      kind: src?.kind,
      room: roomName(src?.room),
      npc: npcName(src?.npc),
      object: src?.object,
      day: d.day,
    };
    return d.itemIds.map((id) => {
      const fact = c.facts.facts.find((f) => f.id === id);
      if (fact)
        return { id, type: 'fact' as const, text: fact.text, claims: [claimOf(fact)], source };
      const stmt = c.statements.statements.find((s) => s.id === id);
      if (stmt)
        return {
          id,
          type: 'statement' as const,
          text: stmt.text,
          npc: npcName(stmt.npc),
          claims: stmt.claims,
          source,
        };
      const item = c.puzzles.items.find((i) => i.id === id);
      return { id, type: 'item' as const, text: item?.text ?? '', name: item?.name, source };
    });
  });

  const room = c.rooms.rooms.find((r) => r.id === st.room);
  const blockedToday = ctx.reach.blocked(st.room, st.day);
  const q = questionOfDay(ctx, st.day);
  const qp = st.questions[st.day];
  const canPlay = canPlayDay(st, now, startDate);
  const prolog = c.prolog.days.find((d) => d.day === st.day);
  const hasBook = c.sources.sources.some(
    (s) => s.kind === 'hotelbook' && [st.room, '*'].includes(ctx.reach.roomOn(s.id, st.day) ?? ''),
  );

  return {
    player: { id: player.id, name: player.name, avatar: player.avatar, settings: player.settings },
    today,
    start_date: startDate,
    day: st.day,
    can_play: canPlay,
    finished: st.day > 24,
    explore: exploreProgress(st, ctx),
    links: linksOf(st, ctx).map(({ id, text, done }) => ({ id, text, done })),
    points: totalPoints(st),
    breakdown: breakdown(st),
    rank: rankOf(totalPoints(st), scoring),
    room: room && {
      id: room.id,
      name: room.name,
      description: room.description,
      scene: room.scene ?? room.id,
      blocked: blockedToday,
      book: hasBook && !blockedToday,
      objects: room.objects.map((o) => ({
        id: o.id,
        name: o.name,
        text: o.text,
        // only things that really bring a find in this room today are marked (02b: nothing else gets a "!")
        auffaellig:
          o.auffaellig &&
          c.sources.sources.some(
            (x) =>
              x.object === o.id &&
              x.yields.length > 0 &&
              ctx.reach.roomOn(x.id, st.day) === st.room,
          ),
        spot: o.spot,
        prop: o.prop,
        scale: o.scale,
        layer: o.layer,
        // state of the thing: opened once everything its inspect sources hold has been found
        explored: c.sources.sources
          .filter((x) => x.kind === 'inspect' && x.object === o.id)
          .some((x) => x.yields.length > 0 && x.yields.every((y) => st.found.includes(y))),
      })),
      npcs: blockedToday
        ? []
        : c.npcs.npcs
            .filter((n) => (n.schedule as Record<number, string>)[st.day] === st.room)
            .map((n) => ({ id: n.id, name: n.name, role: n.role, topics: n.topics })),
    },
    map: {
      rooms: c.rooms.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        neighbors: r.neighbors,
        plan: r.plan,
        corridor: r.corridor,
      })),
      doors: c.rooms.doors,
      outside: c.rooms.outside,
      stairs: c.rooms.stairs,
      next_rooms: st.day <= 24 ? nextRooms(st, ctx) : [],
    },
    finds,
    // pocketed documents: title and the full text, readable again at any time
    documents: (st.pocket ?? []).flatMap((sid) => {
      const src = c.sources.sources.find((x) => x.id === sid);
      if (!src?.document) return [];
      return [
        {
          id: sid,
          title: src.document.title,
          kind: src.document.kind,
          room: roomName(src.room),
          day: st.discoveries.find((d) => d.sourceId === sid)?.day,
          presentation: src.presentation,
          note: src.note,
          lines: src.lines,
        },
      ];
    }),
    inventory: st.inventory.map((id) => {
      const i = c.puzzles.items.find((x) => x.id === id);
      return { id, name: i?.name ?? id, text: i?.text ?? '' };
    }),
    puzzles: c.puzzles.puzzles
      .filter((p) => p.room === st.room)
      .map((p) => {
        const prog = st.puzzles[p.id];
        return {
          id: p.id,
          type: p.type,
          prompt: p.prompt,
          solved: prog?.solved ?? false,
          hints: p.hints.slice(0, Math.min(prog?.hints ?? 0, 2)),
        };
      }),
    question: q && {
      id: q.id,
      text: q.text,
      options: q.options,
      attempts_left: 2 - (qp?.attempts ?? 0),
      done: qp?.done ?? false,
      correct: qp?.done ? qp.correct : undefined,
      hint: qp?.hint ? q.hint : undefined,
      can_hint: !!q.hint && !qp?.done,
    },
    prolog: prolog && { goal: prolog.goal, intro: prolog.intro, tips: prolog.tips },
    daily_puzzle:
      st.day <= 24
        ? dailyView(
            st,
            dailyPuzzleFor(
              startSalt(tx),
              st.day,
              dailyLevel(st, ctx, player.settings.puzzle_level),
            ),
          )
        : null,
    theory: st.theory,
    theory_history: st.theoryHistory ?? [],
    // public candidate lists (never the solution)
    options: {
      who: c.case.categories.who.map((id) => ({ id, name: npcName(id) ?? id })),
      accomplice: c.case.categories.accomplice.map((id) => ({ id, name: npcName(id) ?? id })),
      when: c.case.categories.when.map((id) => ({
        id,
        name: c.case.windows.find((w) => w.id === id)?.label ?? id,
      })),
      where: c.case.categories.where.map((id) => ({ id, name: roomName(id) ?? id })),
    },
    people: c.npcs.npcs.map((n) => ({ id: n.id, name: n.name })),
    notes: notesOf(st, ctx, player.settings.note_level ?? 'half'),
    reports: Object.entries(st.reports ?? {}).map(([day, right]) => ({
      day: Number(day),
      right,
      sentence: inspectorSentence(right),
    })),
    accusation: {
      can: canAccuse(st, ctx),
      done: st.accused,
      from_day: accusationFromDay(ctx),
      proof_questions: c.case.proof_questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
      })),
    },
    // the story: only after the own accusation AND from the real day 24 on
    story: st.accused && today >= 24 ? resolutionOf(ctx, st) : null,
    newspaper_days: Math.max(0, Math.min(24, today)),
  };
}

const LABELS: Record<string, string> = {
  day_played: 'Tag gespielt',
  find: 'Neue Funde',
  question: 'Frage des Tages',
  puzzle: 'Rätsel des Tages',
  plaque: 'Plaketten (Erste/r)',
  mini_case: 'Stollen-Übungsfall',
  report_card: 'Wochenzeugnis',
  finale: 'Anklage',
  proof: 'Beweisfragen',
  early_accusation: 'Frühanklage-Bonus',
};

/** Where the points came from, grouped by source (the "Meine Punkte" list). */
export function breakdown(st: PlayerState) {
  const by = new Map<string, { points: number; count: number }>();
  for (const l of st.ledger) {
    const e = by.get(l.kind) ?? { points: 0, count: 0 };
    by.set(l.kind, { points: e.points + l.points, count: e.count + 1 });
  }
  return [...by].map(([kind, v]) => ({ kind, label: LABELS[kind] ?? kind, ...v }));
}

const startSalt = (tx: GameTx) => tx.game.slug;

function claimOf(f: FactBody): FactBody {
  // strip id/text/tags: only the structural claim is needed for grid and timeline
  switch (f.type) {
    case 'presence':
    case 'absence':
      return { type: f.type, person: f.person, window: f.window, room: f.room };
    case 'exclusion':
      return { type: 'exclusion', category: f.category, candidate: f.candidate };
    case 'link':
      return { type: 'link', if: f.if, then: f.then };
    case 'object_state':
      return {
        type: 'object_state',
        object: f.object,
        window: f.window,
        state: f.state,
        effect: f.effect,
      };
  }
}

export type PlayerView = ReturnType<typeof buildView>;
