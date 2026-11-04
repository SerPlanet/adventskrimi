import { z } from 'zod';
import { dayOf, newPlayer, totalPoints } from '../game';
import { ctxOf } from './handlers';
import { ApiError, type Store } from './types';

const PlayerFields = z.object({
  name: z.string().min(1).max(40),
  avatar: z.string().max(40).nullable().optional(),
  is_duo: z.boolean().optional(),
});

export const AdminRequest = z.discriminatedUnion('op', [
  z.object({ op: z.literal('list'), game_id: z.string().min(1) }),
  z.object({ op: z.literal('games') }),
  z.object({ op: z.literal('overview'), game_id: z.string().min(1) }),
  z.object({
    op: z.literal('regen_paper'),
    game_id: z.string().min(1),
    day: z.number().int().min(1).max(24),
  }),
  z.object({ op: z.literal('create'), game_id: z.string().min(1), player: PlayerFields }),
  z.object({
    op: z.literal('update'),
    player_id: z.string().min(1),
    player: PlayerFields.partial(),
  }),
]);

const publicPlayer = (p: { id: string; name: string; avatar: string | null; isDuo: boolean }) => ({
  id: p.id,
  name: p.name,
  avatar: p.avatar,
  is_duo: p.isDuo,
});

/** Admin player management. The caller (the edge function) has already checked the admin token. */
export async function adminPlayers(store: Store, body: unknown, now: Date = new Date()) {
  const req = AdminRequest.parse(body);
  if (req.op === 'games') {
    return { games: await store.listGames() };
  }
  if (req.op === 'overview') {
    // counts and flags only: never a theory, a find text, a solution or anything still locked
    const game = await store.game(req.game_id, async (g) => g.game);
    const players = await store.listPlayers(req.game_id);
    return {
      now: now.toISOString(),
      today: dayOf(now, game.startDate),
      game: { name: game.name, profile: game.profile.id, start_date: game.startDate },
      players: players.map((p) => ({
        ...publicPlayer(p),
        day: p.state.day,
        days_finished: p.state.finishedDays.length,
        finds: p.state.found.length,
        filed: p.state.filed.length,
        points: totalPoints(p.state),
        accused: p.state.accused,
        accused_day: p.state.accusedDay ?? null,
      })),
    };
  }
  if (req.op === 'regen_paper') {
    await store.game(req.game_id, (g) => g.dropNewspaper(req.day));
    return { regenerated: req.day };
  }
  if (req.op === 'list') {
    return { players: (await store.listPlayers(req.game_id)).map(publicPlayer) };
  }
  if (req.op === 'create') {
    // the n-th player of a game gets the n-th corridor (WP20 §2)
    const ordinal = (await store.listPlayers(req.game_id)).length;
    const state = await store.game(req.game_id, async (g) => newPlayer(await ctxOf(g), ordinal));
    const p = await store.createPlayer(req.game_id, {
      name: req.player.name,
      avatar: req.player.avatar ?? null,
      isDuo: req.player.is_duo ?? false,
      state,
    });
    return { player: publicPlayer(p) };
  }
  const p = await store.updatePlayer(req.player_id, {
    name: req.player.name,
    avatar: req.player.avatar,
    isDuo: req.player.is_duo,
  });
  if (!p) throw new ApiError('player_not_found', 404);
  return { player: publicPlayer(p) };
}
