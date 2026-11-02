import { z } from 'zod';
import { newPlayer } from '../game';
import { ctxOf } from './handlers';
import { ApiError, type Store } from './types';

const PlayerFields = z.object({
  name: z.string().min(1).max(40),
  avatar: z.string().max(40).nullable().optional(),
  is_duo: z.boolean().optional(),
});

export const AdminRequest = z.discriminatedUnion('op', [
  z.object({ op: z.literal('list'), game_id: z.string().min(1) }),
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
export async function adminPlayers(store: Store, body: unknown) {
  const req = AdminRequest.parse(body);
  if (req.op === 'list') {
    return { players: (await store.listPlayers(req.game_id)).map(publicPlayer) };
  }
  if (req.op === 'create') {
    const state = await store.game(req.game_id, async (g) => newPlayer(await ctxOf(g)));
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
