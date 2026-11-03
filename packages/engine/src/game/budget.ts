import type { Action } from './actions';
import type { GameCtx, PlayerState } from './state';

/** Only "Genauer untersuchen" costs an action (02b §1); talking, showing and reading are free. */
export const costsAction = (a: Action): boolean => a.type === 'inspect';

/** Actions available on a day: the profile's value, with overrides for the prolog days. */
export function budgetOf(ctx: Pick<GameCtx, 'profile'>, day: number): number {
  const cfg = ctx.profile.actions_per_day;
  return (cfg.prolog as Record<number, number>)[day] ?? cfg.default;
}

export const actionsLeft = (st: PlayerState, ctx: GameCtx): number =>
  Math.max(0, budgetOf(ctx, st.day) - st.actionsUsed);
