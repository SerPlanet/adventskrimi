import { z } from 'zod';
import { ApiError, type Store } from './types';

export const LobbyRequest = z.object({ slug: z.string().regex(/^[a-z0-9-]{2,40}$/) });

/** Public data for the name tiles of ONE game (chosen by link slug): name and avatar only. */
export async function lobby(store: Store, body: unknown) {
  const req = LobbyRequest.parse(body);
  const game = await store.gameBySlug(req.slug);
  if (!game) throw new ApiError('unknown_game', 404);
  const players = (await store.listPlayers(game.id)).map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    is_duo: p.isDuo,
  }));
  return { game: { name: game.name, profile: game.profile }, players };
}
