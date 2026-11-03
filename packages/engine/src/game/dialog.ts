import { openSources, type Action } from './actions';
import type { GameCtx, PlayerState } from './state';

/** What was said: speech bubbles, and the finds (facts, statements) the answer holds. */
export interface Answer {
  lines: { speaker: string; text: string }[];
  finds: string[];
}

const NOTHING = 'Dazu weiß ich nichts.';

/**
 * The answer to a question or a shown item (02c §6). Every question has one: without a source in
 * this room today, the figure says it knows nothing. Free of charge, repeatable, nothing changes.
 */
export function answerOf(st: PlayerState, ctx: GameCtx, a: Action): Answer | undefined {
  if (a.type !== 'talk' && a.type !== 'use') return undefined;
  const npcId = a.type === 'talk' ? a.npc : a.target;
  const npc = ctx.c.npcs.npcs.find((n) => n.id === npcId);
  if (!npc) return undefined;
  const label =
    a.type === 'talk'
      ? (npc.topics.find((t) => t.id === a.topic)?.label ?? '')
      : 'Ich zeige dir etwas.';
  const src = openSources(st, ctx, a)[0];
  if (!src)
    return {
      lines: [
        { speaker: 'Du', text: label },
        { speaker: npc.name, text: NOTHING },
      ],
      finds: [],
    };
  const finds = src.yields.filter(
    (y) =>
      ctx.c.facts.facts.some((f) => f.id === y) ||
      ctx.c.statements.statements.some((s) => s.id === y),
  );
  if (src.lines?.length) return { lines: src.lines, finds };
  const said = finds
    .map(
      (y) =>
        ctx.c.statements.statements.find((s) => s.id === y)?.text ??
        ctx.c.facts.facts.find((f) => f.id === y)?.text,
    )
    .filter(Boolean)
    .join(' ');
  return {
    lines: [
      { speaker: 'Du', text: label },
      { speaker: npc.name, text: said || NOTHING },
    ],
    finds,
  };
}
