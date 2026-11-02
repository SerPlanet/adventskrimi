import type { LoadedCase } from '../loader';
import type { FactBody, Profile } from '../schemas';

function remapBody<T extends FactBody>(b: T, win: (w: string) => string): T {
  if (b.type === 'presence' || b.type === 'absence' || b.type === 'object_state')
    return { ...b, window: win(b.window) };
  return b;
}

/**
 * Applies a profile's subset to the full case: filters rooms/npcs/facts/sources,
 * drops everything that references removed entities, merges window groups.
 * Returns a new LoadedCase; the input is not mutated.
 */
export function applyProfile(full: LoadedCase, p: Profile): LoadedCase {
  const inc = p.include;
  const rooms = new Set((inc.rooms ?? full.rooms.rooms.map((r) => r.id)) as string[]);
  const npcs = new Set((inc.npcs ?? full.npcs.npcs.map((n) => n.id)) as string[]);
  const groups = inc.window_groups;
  const toGroup = new Map<string, string>();
  for (const [g, ws] of Object.entries(groups ?? {})) for (const w of ws) toGroup.set(w, g);
  const win = (w: string) => toGroup.get(w) ?? w;

  const refsOk = (b: FactBody): boolean => {
    switch (b.type) {
      case 'presence':
      case 'absence':
        return npcs.has(b.person) && rooms.has(b.room);
      case 'exclusion':
        return b.category === 'who' || b.category === 'accomplice'
          ? npcs.has(b.candidate)
          : b.category === 'where'
            ? rooms.has(b.candidate)
            : true;
      default:
        return true;
    }
  };

  const facts = full.facts.facts
    .filter((f) => !inc.exclude_facts.includes(f.id) && refsOk(f))
    .map((f) => remapBody(f, win));
  const statements = full.statements.statements
    .filter((s) => npcs.has(s.npc) && s.claims.every(refsOk))
    .map((s) => ({ ...s, claims: s.claims.map((c) => remapBody(c, win)) }));
  const known = new Set([
    ...facts.map((f) => f.id),
    ...statements.map((s) => s.id),
    ...full.puzzles.items.map((i) => i.id),
  ]);
  const objectRoom = new Map<string, string>();
  for (const r of full.rooms.rooms) for (const o of r.objects) objectRoom.set(o.id, r.id);

  const sources = full.sources.sources
    .filter((s) => !inc.exclude_sources.includes(s.id))
    .filter((s) => (!s.room || rooms.has(s.room)) && (!s.npc || npcs.has(s.npc)))
    .filter((s) => !s.object || rooms.has(objectRoom.get(s.object) ?? ''))
    .map((s) => ({ ...s, yields: s.yields.filter((y) => known.has(y)) }))
    .filter((s) => s.yields.length > 0);
  const sourceIds = new Set(sources.map((s) => s.id));

  const keepCat = (k: 'who' | 'accomplice' | 'when' | 'where', ids: string[]) => {
    const pool = k === 'where' ? rooms : k === 'when' ? null : npcs;
    const mapped = k === 'when' ? ids.map(win) : ids.filter((i) => pool?.has(i));
    return [...new Set(mapped)];
  };
  const categories = {
    who: keepCat('who', full.case.categories.who ?? []),
    accomplice: keepCat('accomplice', full.case.categories.accomplice ?? []),
    when: keepCat('when', full.case.categories.when ?? []),
    where: keepCat('where', full.case.categories.where ?? []),
  };
  const windows = groups
    ? [...new Set(full.case.windows.map((w) => win(w.id)))].map((id) => {
        const members = full.case.windows.filter((w) => win(w.id) === id);
        const first = members[0]!;
        const last = members[members.length - 1]!;
        return { id, label: id, from: first.from, to: last.to };
      })
    : full.case.windows;

  const positions: Record<string, Record<string, string>> = {};
  for (const [person, byWin] of Object.entries(full.world.positions)) {
    if (!npcs.has(person)) continue;
    positions[person] = {};
    for (const [w, room] of Object.entries(byWin))
      if (positions[person]![win(w)] === undefined) positions[person]![win(w)] = room;
  }
  const crime = { ...full.world.crime, window: win(full.world.crime.window) };

  return {
    ...full,
    case: {
      ...full.case,
      categories,
      windows,
      solution: { ...full.case.solution, when: win(full.case.solution.when ?? '') },
    },
    world: { positions, crime },
    rooms: {
      rooms: full.rooms.rooms
        .filter((r) => rooms.has(r.id))
        .map((r) => ({ ...r, neighbors: r.neighbors.filter((n) => rooms.has(n)) })),
    },
    npcs: { npcs: full.npcs.npcs.filter((n) => npcs.has(n.id)) },
    facts: { facts },
    statements: { statements },
    sources: { sources },
    puzzles: {
      ...full.puzzles,
      puzzles: full.puzzles.puzzles.filter((q) => rooms.has(q.room) && sourceIds.has(q.unlocks)),
    },
  };
}
