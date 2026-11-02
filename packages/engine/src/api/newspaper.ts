import type { GameCtx } from '../game';
import type { DayActivity, NewspaperContent } from './types';

/**
 * Builds the newspaper of a day from case templates and anonymised numbers of the day before.
 * Deterministic for given inputs. Never mentions the content or place of a find.
 */
export function generateNewspaper(
  ctx: GameCtx,
  day: number,
  yesterday: DayActivity[],
  plaques: { title: string; player: string }[],
  accusations: string[] = [],
): NewspaperContent {
  const { c, profile } = ctx;
  const ev = c.events.events.find((e) => e.day === day);
  const roomName = (id: string) => c.rooms.rooms.find((r) => r.id === id)?.name ?? id;
  const active = yesterday.filter((a) => a.room !== null);
  const enough = active.length >= profile.rumor_min_players;

  const gossipPool = c.newspaper.gossip.filter((g) => (g.min_players ?? 0) <= active.length);
  const gossip = gossipPool.length ? [gossipPool[day % gossipPool.length]!.text] : [];
  const ads = c.newspaper.ads.length ? [c.newspaper.ads[day % c.newspaper.ads.length]!.text] : [];
  const filler = c.newspaper.filler.filter((f) => f.day === day).map((f) => f.text);

  const rumors: string[] = [];
  if (enough) {
    const counts = new Map<string, number>();
    for (const a of active) counts.set(a.room as string, (counts.get(a.room as string) ?? 0) + 1);
    const crowd = [...counts].find(([, n]) => n >= Math.ceil(profile.crowd_share * active.length));
    if (crowd)
      rumors.push(`Großversammlung: Im Raum „${roomName(crowd[0])}“ war gestern viel los.`);
    const empty = c.rooms.rooms.find((r) => !counts.has(r.id) && !ctx.reach.blocked(r.id, day - 1));
    if (empty) rumors.push(`Der Raum „${empty.name}“ lag gestern verlassen da.`);
  }

  const best = [...yesterday].sort((a, b) => b.points - a.points)[0];
  return {
    day,
    headline: ev?.headline ?? 'Ein ruhiger Tag im Hotel',
    text: ev?.text ?? 'Im Berghotel passiert heute nichts Besonderes.',
    weather: ev?.weather,
    blocked_rooms: (ev?.blocked_rooms ?? []).map(roomName),
    bonus_rooms: (ev?.bonus_rooms ?? []).map(roomName),
    gossip,
    ads,
    filler,
    rumors,
    plaques,
    accusations,
    detective_of_day: best && best.points > 0 ? { name: best.name, points: best.points } : null,
  };
}
