import type { GameCtx } from '../game';
import { renderAll } from '../names';
import type { DayActivity, NewspaperContent } from './types';

/** Default display names of the figures, for the placeholders {n:id}. */
export const namesOf = (ctx: GameCtx): Record<string, string> =>
  Object.fromEntries(ctx.c.npcs.npcs.map((n) => [n.id, n.name]));

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

  // the stories: the lead, the gossip and the case's own articles of the day
  const articles = [
    {
      id: `a${day}_lead`,
      title: ev?.headline ?? 'Ein ruhiger Tag im Hotel',
      text: ev?.text ?? 'Im Berghotel passiert heute nichts Besonderes.',
    },
    ...gossip.map((text, i) => ({ id: `a${day}_k${i + 1}`, title: 'Klatsch und Tratsch', text })),
    ...c.newspaper.articles
      .filter((a) => a.day === day)
      .map((a) => ({ id: a.id, title: a.title, text: a.text })),
  ];

  const best = [...yesterday].sort((a, b) => b.points - a.points)[0];
  const paper: NewspaperContent = {
    day,
    articles,
    weather: ev?.weather,
    blocked_rooms: (ev?.blocked_rooms ?? []).map(roomName),
    bonus_rooms: (ev?.bonus_rooms ?? []).map(roomName),
    ads,
    filler,
    rumors,
    plaques,
    accusations,
    detective_of_day: best && best.points > 0 ? { name: best.name, points: best.points } : null,
  };
  // every field of the page is rendered, whatever the stored case still holds
  return renderAll(paper, {}, namesOf(ctx));
}
