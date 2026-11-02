import type { LoadedCase } from './loader';
import type { FactBody } from './schemas';

/** Cross-file reference and uniqueness checks. Returns human-readable errors. */
export function checkRefs(c: LoadedCase): string[] {
  const errs: string[] = [];
  const dup = (file: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errs.push(`${file}: duplicate id "${id}"`);
      seen.add(id);
    }
    return seen;
  };
  const rooms = dup(
    'rooms.yaml',
    c.rooms.rooms.map((r) => r.id),
  );
  const npcs = dup(
    'npcs.yaml',
    c.npcs.npcs.map((n) => n.id),
  );
  const windows = dup(
    'case.yaml',
    c.case.windows.map((w) => w.id),
  );
  const factIds = dup('facts.yaml/statements.yaml', [
    ...c.facts.facts.map((f) => f.id),
    ...c.statements.statements.map((s) => s.id),
  ]);
  const sources = dup(
    'sources.yaml',
    c.sources.sources.map((s) => s.id),
  );
  const puzzles = dup(
    'puzzles.yaml',
    c.puzzles.puzzles.map((p) => p.id),
  );
  const items = dup(
    'puzzles.yaml',
    c.puzzles.items.map((i) => i.id),
  );
  dup(
    'questions.yaml',
    c.questions.questions.map((q) => q.id),
  );
  const objects = new Map<string, string>(); // object id -> room id
  for (const r of c.rooms.rooms) for (const o of r.objects) objects.set(o.id, r.id);

  const need = (
    file: string,
    where: string,
    set: Set<string> | Map<string, unknown>,
    id: string,
    what: string,
  ) => {
    if (!set.has(id)) errs.push(`${file}: ${where}: unknown ${what} "${id}"`);
  };

  for (const r of c.rooms.rooms)
    for (const n of r.neighbors) need('rooms.yaml', `${r.id}.neighbors`, rooms, n, 'room');
  for (const n of c.npcs.npcs)
    for (const [day, room] of Object.entries(n.schedule))
      need('npcs.yaml', `${n.id}.schedule.${day}`, rooms, room, 'room');

  const cat = c.case.categories;
  const pools = { who: npcs, accomplice: npcs, when: windows, where: rooms } as const;
  for (const k of ['who', 'accomplice', 'when', 'where'] as const) {
    for (const id of cat[k] ?? []) need('case.yaml', `categories.${k}`, pools[k], id, k);
    const sol = c.case.solution[k];
    if (!sol) errs.push(`case.yaml: solution.${k} missing`);
    else if (!(cat[k] ?? []).includes(sol))
      errs.push(`case.yaml: solution.${k} not among candidates`);
  }
  if (c.case.solution.who && c.case.solution.who === c.case.solution.accomplice)
    errs.push('case.yaml: accomplice must differ from thief');
  for (const q of c.case.proof_questions)
    for (const id of q.correct)
      if (!q.options.some((o) => o.id === id))
        errs.push(`case.yaml: ${q.id}: correct "${id}" not an option`);

  for (const [p, byWin] of Object.entries(c.world.positions)) {
    need('world.yaml', 'positions', npcs, p, 'npc');
    for (const [w, room] of Object.entries(byWin)) {
      need('world.yaml', `positions.${p}`, windows, w, 'window');
      need('world.yaml', `positions.${p}.${w}`, rooms, room, 'room');
    }
  }
  const cr = c.world.crime;
  for (const [k, set] of [
    ['thief', npcs],
    ['accomplice', npcs],
    ['window', windows],
    ['theft_room', rooms],
    ['distraction_room', rooms],
    ['hiding_place', rooms],
  ] as const)
    need('world.yaml', `crime.${k}`, set, cr[k], k);

  const checkBody = (file: string, where: string, b: FactBody) => {
    if (b.type === 'presence' || b.type === 'absence') {
      need(file, where, npcs, b.person, 'npc');
      need(file, where, windows, b.window, 'window');
      need(file, where, rooms, b.room, 'room');
    } else if (b.type === 'exclusion') {
      need(file, where, pools[b.category], b.candidate, b.category);
    } else if (b.type === 'link') {
      need(file, where, pools[b.if.category], b.if.value, b.if.category);
      for (const v of b.then.values) need(file, where, pools[b.then.category], v, b.then.category);
    } else {
      need(file, where, objects, b.object, 'object');
      need(file, where, windows, b.window, 'window');
      for (const v of b.effect?.excludes ?? [])
        need(file, where, pools[b.effect!.category], v, b.effect!.category);
    }
  };
  for (const f of c.facts.facts) checkBody('facts.yaml', f.id, f);
  for (const s of c.statements.statements) {
    need('statements.yaml', s.id, npcs, s.npc, 'npc');
    s.claims.forEach((cl) => checkBody('statements.yaml', s.id, cl));
  }

  for (const s of c.sources.sources) {
    if (s.room) need('sources.yaml', s.id, rooms, s.room, 'room');
    if (s.npc) need('sources.yaml', s.id, npcs, s.npc, 'npc');
    if (s.object) need('sources.yaml', s.id, objects, s.object, 'object');
    if (s.requires && !items.has(s.requires) && !puzzles.has(s.requires))
      errs.push(`sources.yaml: ${s.id}: unknown requires "${s.requires}"`);
    for (const y of s.yields) need('sources.yaml', s.id, factIds, y, 'fact/statement');
  }
  for (const p of c.puzzles.puzzles) {
    need('puzzles.yaml', p.id, rooms, p.room, 'room');
    need('puzzles.yaml', p.id, sources, p.unlocks, 'source');
  }
  for (const e of c.events.events)
    for (const r of [...e.blocked_rooms, ...e.bonus_rooms])
      need('events.yaml', `day ${e.day}`, rooms, r, 'room');
  for (const q of c.questions.questions)
    if (!q.options.some((o) => o.id === q.correct))
      errs.push(`questions.yaml: ${q.id}: correct not an option`);
  return errs;
}
