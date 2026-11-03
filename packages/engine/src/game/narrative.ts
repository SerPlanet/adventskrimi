import type { GameCtx, PlayerState } from './state';

/**
 * The opening of a day (02c §2): three to five sentences in the Du-form about the last step and
 * the new room, never about the case. Built from the room blocks `abgang`/`ankunft`, the
 * morning of the day and an echo of the last thing the player did (who or what, never what came
 * of it). Without a block the room name carries the sentence.
 */
export function narrativeOf(st: PlayerState, ctx: GameCtx): string {
  const { c } = ctx;
  const room = c.rooms.rooms.find((r) => r.id === st.room);
  if (!room) return '';
  const parts: string[] = [];
  if (st.day === 1) {
    parts.push(c.prolog.arrival ?? 'Du kommst im Hotel an.');
  } else {
    const prev = c.rooms.rooms.find((r) => r.id === (st.prevRoom ?? st.room));
    if (prev) parts.push(prev.abgang ?? `Du verlässt den Raum „${prev.name}“.`);
  }
  parts.push(room.ankunft ?? `Du bist jetzt im Raum „${room.name}“.`);
  const morning = c.events.events.find((e) => e.day === st.day)?.morgen;
  if (morning) parts.push(morning);
  // echo: the last find of an earlier day, only its kind and its subject
  const last = [...st.discoveries].reverse().find((d) => d.day < st.day);
  const src = last && c.sources.sources.find((s) => s.id === last.sourceId);
  if (src?.kind === 'talk' && src.npc) {
    const who = c.npcs.npcs.find((n) => n.id === src.npc)?.name;
    if (who) parts.push(`Das Gespräch mit ${who} geht dir noch nach.`);
  } else if (src?.kind === 'inspect' && src.object) {
    const what = c.rooms.rooms.flatMap((r) => r.objects).find((o) => o.id === src.object)?.name;
    if (what) parts.push(`Du denkst noch an „${what}“.`);
  }
  return parts.join(' ');
}
