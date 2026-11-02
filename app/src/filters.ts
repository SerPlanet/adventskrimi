import type { Find } from './screens/FindCard';

export interface FindFilter {
  q: string;
  type: 'all' | 'fact' | 'statement';
  person: string;
  room: string;
  day: string;
}

export const emptyFilter: FindFilter = { q: '', type: 'all', person: '', room: '', day: '' };

const personOf = (f: Find): string | undefined => (f.type === 'statement' ? f.npc : undefined);

/** Filters the player's own finds by type, person, room, day and free text. */
export function filterFinds(finds: Find[], f: FindFilter): Find[] {
  const q = f.q.trim().toLowerCase();
  return finds.filter(
    (x) =>
      x.type !== 'item' &&
      (f.type === 'all' || x.type === f.type) &&
      (!f.person || x.source.npc === f.person || personOf(x) === f.person) &&
      (!f.room || x.source.room === f.room) &&
      (!f.day || String(x.source.day) === f.day) &&
      (!q || x.text.toLowerCase().includes(q) || (personOf(x) ?? '').toLowerCase().includes(q)),
  );
}

const distinct = (xs: (string | number | undefined)[]): string[] => [
  ...new Set(xs.filter((x) => x !== undefined && x !== '').map(String)),
];

/** Distinct values for the filter drop-downs. */
export function options(finds: Find[]) {
  return {
    persons: distinct(finds.flatMap((x) => [x.source.npc, personOf(x)])).sort(),
    rooms: distinct(finds.map((x) => x.source.room)).sort(),
    days: distinct(finds.map((x) => x.source.day)).sort((a, b) => Number(a) - Number(b)),
  };
}
