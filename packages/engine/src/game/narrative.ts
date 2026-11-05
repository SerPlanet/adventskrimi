import type { GameCtx, PlayerState } from './state';

/** The page after "Tag beenden": how the day ends in the room the player is leaving. */
export function nightOf(st: PlayerState, ctx: GameCtx): string {
  const room = ctx.c.rooms.rooms.find((r) => r.id === st.room);
  const left = ctx.c.rooms.rooms.find((r) => r.id === (st.prevRoom ?? st.room)) ?? room;
  return (
    left?.abend ?? `Der Tag im Raum „${left?.name ?? 'Hotel'}“ ist zu Ende. Du legst dich schlafen.`
  );
}

/**
 * The opening of a day as cards (02c §2, WP22c), each at most 60 words, in the Du-form. It tells
 * what happened and sets the mood, it never interprets. First the mood of the day: the story
 * cards of the case or, without them, weather and morning of the day. Last the way into the room:
 * the room left, the room entered and an echo of the last thing the player did (only who or what,
 * never what came of it). Without a block the room name carries the sentence.
 */
export function dayCards(st: PlayerState, ctx: GameCtx, role?: { intro: string }): string[] {
  const { c } = ctx;
  const room = c.rooms.rooms.find((r) => r.id === st.room);
  if (!room) return [];
  const ev = c.events.events.find((e) => e.day === st.day);
  const mission = c.prolog.mission ?? '';
  const cards = ev?.story.length
    ? ev.story.map((t) => t.replace('{auftrag}', mission))
    : [[ev?.weather ? `Draußen: ${ev.weather}.` : '', ev?.morgen ?? ''].filter(Boolean).join(' ')];
  const way: string[] = [];
  if (st.day === 1) {
    way.push(c.prolog.arrival ?? 'Du kommst im Hotel an.');
    if (role) way.push(role.intro);
  } else {
    const prev = c.rooms.rooms.find((r) => r.id === (st.prevRoom ?? st.room));
    if (prev) way.push(prev.abgang ?? `Du verlässt den Raum „${prev.name}“.`);
  }
  way.push(room.ankunft ?? `Du bist jetzt im Raum „${room.name}“.`);
  // echo: the last find of an earlier day, only its kind and its subject
  const last = [...st.discoveries].reverse().find((d) => d.day < st.day);
  const src = last && c.sources.sources.find((s) => s.id === last.sourceId);
  if (src?.kind === 'talk' && src.npc) {
    const who = c.npcs.npcs.find((n) => n.id === src.npc)?.name;
    if (who) way.push(`Das Gespräch mit ${who} geht dir noch nach.`);
  } else if (src?.kind === 'inspect' && src.object) {
    const what = c.rooms.rooms.flatMap((r) => r.objects).find((o) => o.id === src.object)?.name;
    if (what) way.push(`Du denkst noch an „${what}“.`);
  }
  return [...cards.filter(Boolean), way.join(' ')];
}
