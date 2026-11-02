import {
  budgetFor,
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
  const { c, profile, scoring } = ctx;
  const startDate = tx.game.startDate;
  const today = dayOf(now, startDate);
  const roomName = (id?: string) => c.rooms.rooms.find((r) => r.id === id)?.name;
  const npcName = (id?: string) => c.npcs.npcs.find((n) => n.id === id)?.name;

  const finds = st.discoveries.flatMap((d) => {
    const src = c.sources.sources.find((s) => s.id === d.sourceId);
    const source = {
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

  return {
    player: { id: player.id, name: player.name, avatar: player.avatar, settings: player.settings },
    today,
    start_date: startDate,
    day: st.day,
    can_play: canPlay,
    finished: st.day > 24,
    actions: { used: st.actionsUsed, budget: budgetFor(profile, Math.min(st.day, 24)) },
    points: totalPoints(st),
    rank: rankOf(totalPoints(st), scoring),
    room: room && {
      id: room.id,
      name: room.name,
      description: room.description,
      blocked: blockedToday,
      objects: room.objects.map((o) => ({
        id: o.id,
        name: o.name,
        text: o.text,
        auffaellig: o.auffaellig,
      })),
      npcs: blockedToday
        ? []
        : c.npcs.npcs
            .filter((n) => (n.schedule as Record<number, string>)[st.day] === st.room)
            .map((n) => ({ id: n.id, name: n.name, role: n.role, topics: n.topics })),
    },
    map: {
      rooms: c.rooms.rooms.map((r) => ({ id: r.id, name: r.name, neighbors: r.neighbors })),
      next_rooms: st.day <= 24 ? nextRooms(st, ctx) : [],
    },
    finds,
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
    theory: st.theory,
    newspaper_days: Math.max(0, Math.min(24, today)),
  };
}

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
