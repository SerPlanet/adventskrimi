import { addLedger, type GameCtx, type PlayerState } from './state';

/** Links whose two finds the player has both. The hint says what it reminds of, never a verdict. */
export function linksOf(st: PlayerState, ctx: GameCtx) {
  return (ctx.c.case.links ?? [])
    .filter((l) => st.found.includes(l.a) && st.found.includes(l.b))
    .map((l) => ({
      id: l.id,
      text: l.text,
      a: l.a,
      b: l.b,
      done: st.ledger.some((e) => e.kind === 'link' && e.ref === l.id),
    }));
}

/** "Verknüpfen": books the points once per link. null = the player cannot link this yet. */
export function confirmLink(st: PlayerState, ctx: GameCtx, id: string): PlayerState | null {
  if (!linksOf(st, ctx).some((l) => l.id === id)) return null;
  return addLedger(st, { kind: 'link', ref: id, points: ctx.scoring.link, day: st.day });
}

/** "Einstecken": a found document goes into the inventory. null = not a document of this player. */
export function pocketDocument(
  st: PlayerState,
  ctx: GameCtx,
  sourceId: string,
): PlayerState | null {
  const src = ctx.c.sources.sources.find((x) => x.id === sourceId);
  if (!src?.document || !st.discoveries.some((d) => d.sourceId === sourceId)) return null;
  if (st.pocket?.includes(sourceId)) return st;
  return { ...st, pocket: [...(st.pocket ?? []), sourceId] };
}
