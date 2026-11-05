import {
  accusationFromDay,
  budgetOf,
  classOf,
  lockOf,
  canAccuse,
  inspectorSentence,
  notesOf,
  resolutionOf,
  dailyLevel,
  dailyPuzzleFor,
  dailyView,
  canPlayDay,
  dayOf,
  bonusDay,
  corridorOf,
  existsFor,
  guidedRoom,
  narrativeOf,
  nightOf,
  ownWay,
  nextRooms,
  questionOfDay,
  rankOf,
  totalPoints,
  type GameCtx,
  type PlayerState,
} from '../game';
import { fillRole } from '../names';
import type { FactBody } from '../schemas';
import type { GameTx, PlayerRecord } from './types';

/** The role of a player (D78): their choice, else the first of the profile, else a plain default. */
export function roleOf(ctx: GameCtx, settings: { role?: string }) {
  const roles = ctx.profile.roles;
  return (
    roles.find((r) => r.id === settings.role) ??
    roles[0] ?? { id: 'detektiv', name: 'Detektiv', anrede: 'Detektiv', intro: '' }
  );
}

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

  const metNpcs = new Set<string>([
    ...st.discoveries.flatMap((d) => {
      const n = c.sources.sources.find((s) => s.id === d.sourceId)?.npc;
      return n ? [n] : [];
    }),
    ...c.statements.statements.filter((s) => st.found.includes(s.id)).map((s) => s.npc),
  ]);

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
  const role = roleOf(ctx, player.settings);
  const corridor = corridorOf(c, st);
  // on guided days only the way of the player's own corridor is on the plan (WP20, WP21)
  const walk = guidedRoom(c, corridor, st.day) ? new Set(ownWay(c, corridor)) : null;
  const shown = (id: string) => !walk || walk.has(id) || id === st.room;
  // the last day the player ended: what they did that day (the "good night" page)
  const lastEnded = Math.max(0, ...st.finishedDays);
  const ofThatDay = st.discoveries.filter((d) => d.day === lastEnded);
  const night = lastEnded
    ? {
        day: lastEnded,
        talks: new Set(
          ofThatDay
            .filter((d) => c.sources.sources.find((s) => s.id === d.sourceId)?.kind === 'talk')
            .map((d) => d.sourceId),
        ).size,
        finds: ofThatDay.reduce((n, d) => n + d.itemIds.length, 0),
        text: nightOf(st, ctx),
        room: room && { id: room.id, name: room.name },
      }
    : null;
  // the puzzles of all newspapers the player may read; after the calendar day they count less (D77)
  const readable = Math.max(0, Math.min(24, today, st.day));
  const dailyPuzzles = Array.from({ length: readable }, (_, i) => i + 1).map((day) => ({
    day,
    late: day !== bonusDay(st, now, startDate),
    ...dailyView(st, dailyPuzzleFor(startSalt(tx), day, dailyLevel(st, day)), day),
  }));
  const blockedToday = ctx.reach.blocked(st.room, st.day);
  const q = questionOfDay(ctx, st.day);
  const qp = st.questions[st.day];
  const canPlay = canPlayDay(st, now, startDate);
  const prolog = c.prolog.days.find((d) => d.day === st.day);
  const hasBook = c.sources.sources.some(
    (s) => s.kind === 'hotelbook' && [st.room, '*'].includes(ctx.reach.roomOn(s.id, st.day) ?? ''),
  );

  const out = {
    player: { id: player.id, name: player.name, avatar: player.avatar, settings: player.settings },
    today,
    start_date: startDate,
    day: st.day,
    can_play: canPlay,
    finished: st.day > 24,
    actions: { used: st.actionsUsed, budget: budgetOf(ctx, st.day) },
    filed: st.filed,
    points: totalPoints(st),
    breakdown: breakdown(st),
    rank: rankOf(totalPoints(st), scoring),
    room: room && {
      id: room.id,
      name: room.name,
      description: room.description,
      scene: room.scene,
      blocked: blockedToday,
      book: hasBook && !blockedToday,
      // a thing exists for the player once one of its sources does (WP20: route, unlock)
      objects: room.objects
        .filter((o) => {
          const mine = c.sources.sources.filter((x) => x.object === o.id);
          return !mine.length || mine.some((x) => existsFor(x, st, ctx));
        })
        .map((o) => ({
          id: o.id,
          name: o.name,
          text: o.text,
          look_note: o.look_note,
          klasse: classOf(o, c),
          lock: lockOf(st, ctx, o.id),
          spot: o.spot,
          prop: o.prop,
          scale: o.scale,
          layer: o.layer,
          // state of the thing: opened once everything it holds for the player today has been found
          explored: (() => {
            const today = c.sources.sources.filter(
              (x) =>
                x.kind === 'inspect' &&
                x.object === o.id &&
                existsFor(x, st, ctx) &&
                ctx.reach.roomOn(x.id, st.day) === st.room,
            );
            return (
              today.length > 0 && today.every((x) => x.yields.every((y) => st.found.includes(y)))
            );
          })(),
        })),
      npcs: blockedToday
        ? []
        : c.npcs.npcs
            .filter((n) => (n.schedule as Record<number, string>)[st.day] === st.room)
            .map((n) => ({
              id: n.id,
              name: n.name,
              role: n.role,
              // a question exists once one of its answers does (WP20: unlock)
              topics: n.topics.filter((t) => {
                const mine = c.sources.sources.filter(
                  (x) => x.kind === 'talk' && x.npc === n.id && x.topic === t.id,
                );
                return !mine.length || mine.some((x) => existsFor(x, st, ctx));
              }),
            })),
    },
    map: {
      rooms: c.rooms.rooms
        .filter((r) => shown(r.id))
        .map((r) => ({
          id: r.id,
          name: r.name,
          neighbors: r.neighbors.filter(shown),
          plan: r.plan,
          corridor: r.corridor,
        })),
      doors: c.rooms.doors.filter((d) => shown(d.a) && shown(d.b)),
      outside: c.rooms.outside,
      stairs: c.rooms.stairs.filter((s) => shown(s.room)),
      next_rooms: st.day <= 24 ? nextRooms(st, ctx) : [],
      // tomorrow is a guided day: the corridor decides, there is nothing to choose
      guided_next: guidedRoom(c, corridor, st.day + 1) !== undefined,
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
    // what the morning looks like (02c §2), and whether the player's day is over (02c §9)
    narrative: narrativeOf(st, ctx, role),
    // the opening as cards: the story of the day (if any), then the way into the room
    narrative_cards: [
      ...(c.events.events.find((e) => e.day === st.day)?.story ?? []),
      narrativeOf(st, ctx, role),
    ],
    role: { id: role.id, name: role.name },
    // the choice is open until the end of day 1
    roles: ctx.profile.roles.map((r) => ({ id: r.id, name: r.name })),
    role_chosen: player.settings.role !== undefined,
    role_locked: st.day > 1,
    night,
    late_percent: Math.round(scoring.newspaper_puzzle_late_factor * 100),
    day_over: st.finishedDays.includes(today),
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
    daily_puzzles: dailyPuzzles,
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
      // on guided days only rooms of the player's own way are named
      where: c.case.categories.where.filter(shown).map((id) => ({ id, name: roomName(id) ?? id })),
    },
    // the role is only told for people the player has met (a find from a talk or a statement)
    people: c.npcs.npcs.map((n) => ({
      id: n.id,
      name: n.name,
      role: metNpcs.has(n.id) ? n.role : undefined,
    })),
    notes: notesOf(st),
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
    newspaper_days: Math.max(0, Math.min(24, today, st.day)),
  };
  return fillRole(out, role);
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
    case 'story':
      return { type: 'story' };
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
