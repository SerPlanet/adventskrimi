import type { GameCtx, PlayerState } from './state';

/** One entry the player put into the dossier (02c §7). Articles keep their text. */
export type FiledEntry =
  | { kind: 'find'; ref: string; day: number }
  | { kind: 'article'; ref: string; day: number; title: string; text: string };

/** Puts a find (fact, statement or item the player has) into the dossier. */
export function fileFind(st: PlayerState, id: string): PlayerState | null {
  if (!st.discoveries.some((d) => d.itemIds.includes(id))) return null;
  if (st.filed.some((e) => e.kind === 'find' && e.ref === id)) return st;
  const day = st.discoveries.find((d) => d.itemIds.includes(id))?.day ?? st.day;
  return { ...st, filed: [...st.filed, { kind: 'find', ref: id, day }] };
}

/** Puts an article of a newspaper the player may read into the dossier. */
export function fileArticle(
  st: PlayerState,
  article: { id: string; title: string; text: string },
  day: number,
): PlayerState {
  if (st.filed.some((e) => e.kind === 'article' && e.ref === article.id)) return st;
  return {
    ...st,
    filed: [
      ...st.filed,
      { kind: 'article', ref: article.id, day, title: article.title, text: article.text },
    ],
  };
}

/** Takes an entry out again. Everything stays readable in the history. */
export function unfile(st: PlayerState, kind: FiledEntry['kind'], ref: string): PlayerState {
  return { ...st, filed: st.filed.filter((e) => !(e.kind === kind && e.ref === ref)) };
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
