import { openSources, type Action } from './actions';
import type { GameCtx, PlayerState } from './state';

/** What was said: speech bubbles, and the finds (facts, statements) the answer holds. */
export interface Answer {
  lines: { speaker: string; text: string }[];
  finds: string[];
}

/**
 * The answer to a question or a shown item (02c §6). Every question that is offered has one; a
 * question of the story can be asked again and gives the same answer. Free of charge.
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
  // a question that has no answer today is not offered, so there is nothing to say
  if (!src) return undefined;
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
      { speaker: npc.name, text: said },
    ],
    finds,
  };
}
