import type { LoadedCase } from '../loader';
import { totalPoints, type PlayerState } from '../game/state';
import {
  ApiError,
  type DayActivity,
  type GameRecord,
  type GameTx,
  type NewspaperContent,
  type PlayerRecord,
  type PlayerTx,
  type ScoreRow,
  type Settings,
  type Store,
} from './types';

/** In-memory Store for unit tests and the simulator. Same contract as the Postgres store. */
export class MemoryStore implements Store {
  players = new Map<string, PlayerRecord>();
  private responses = new Map<string, unknown>();
  private plaques = new Map<string, { playerId: string; title: string; day: number }>();
  private papers = new Map<number, NewspaperContent>();
  private log = new Map<string, Map<number, { room: string; points: number }>>();
  private queue: Promise<unknown> = Promise.resolve();
  private seq = 0;

  constructor(
    public gameRecord: GameRecord,
    private c: LoadedCase,
  ) {}

  private gameTx(): GameTx {
    const self = this;
    return {
      game: this.gameRecord,
      caseData: async () => self.c,
      async activity(day): Promise<DayActivity[]> {
        return [...self.players.values()].map((p) => {
          const e = self.log.get(p.id)?.get(day);
          return { playerId: p.id, name: p.name, room: e?.room ?? null, points: e?.points ?? 0 };
        });
      },
      async plaquesOnDay(day) {
        return [...self.plaques.values()]
          .filter((p) => p.day === day)
          .map((p) => ({ title: p.title, player: self.players.get(p.playerId)?.name ?? '' }));
      },
      async scoreboard(): Promise<ScoreRow[]> {
        return [...self.players.values()].map((p) => ({
          playerId: p.id,
          name: p.name,
          avatar: p.avatar,
          points: totalPoints(p.state),
          plaques: [...self.plaques.values()].filter((x) => x.playerId === p.id).length,
        }));
      },
      async newspaper(day) {
        return self.papers.get(day);
      },
      async storeNewspaper(day, content) {
        if (!self.papers.has(day)) self.papers.set(day, content);
        return self.papers.get(day) as NewspaperContent;
      },
    };
  }

  private record(p: PlayerRecord, st: PlayerState) {
    const byDay = this.log.get(p.id) ?? new Map();
    for (const day of new Set([p.state.day, st.day])) {
      if (day > 24) continue;
      const room = day === st.day ? st.room : p.state.room;
      const points = st.ledger.filter((l) => l.day === day).reduce((n, l) => n + l.points, 0);
      byDay.set(day, { room, points });
    }
    this.log.set(p.id, byDay);
  }

  async transaction<T>(
    playerId: string,
    fn: (tx: PlayerTx) => Promise<T>,
    opts: { lock: boolean; slug?: string } = { lock: true },
  ): Promise<T> {
    const run = async () => {
      const player = this.players.get(playerId);
      if (!player || (opts.slug !== undefined && opts.slug !== this.gameRecord.slug))
        throw new ApiError('player_not_found', 404);
      const self = this;
      const tx: PlayerTx = {
        ...this.gameTx(),
        get player() {
          return self.players.get(playerId) as PlayerRecord;
        },
        async saved(id) {
          return self.responses.get(`${playerId}:${id}`);
        },
        async remember(id, response) {
          self.responses.set(`${playerId}:${id}`, response);
        },
        async save(next: PlayerState, settings?: Settings) {
          const cur = self.players.get(playerId) as PlayerRecord;
          self.record(cur, next);
          self.players.set(playerId, { ...cur, state: next, settings: settings ?? cur.settings });
        },
        async tryPlaque(sourceId, title) {
          if (self.plaques.has(sourceId)) return false;
          const cur = self.players.get(playerId) as PlayerRecord;
          self.plaques.set(sourceId, { playerId, title, day: cur.state.day });
          return true;
        },
      };
      return fn(tx);
    };
    if (!opts.lock) return run();
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  async game<T>(_gameId: string, fn: (tx: GameTx) => Promise<T>): Promise<T> {
    return fn(this.gameTx());
  }

  async gameBySlug(slug: string) {
    const g = this.gameRecord;
    return g.slug === slug ? { id: g.id, name: g.name, profile: g.profile.id } : undefined;
  }

  async listPlayers() {
    return [...this.players.values()];
  }

  async createPlayer(
    gameId: string,
    p: { name: string; avatar: string | null; isDuo: boolean; state: PlayerState },
  ) {
    const rec: PlayerRecord = {
      id: `p${++this.seq}`,
      gameId,
      name: p.name,
      avatar: p.avatar,
      isDuo: p.isDuo,
      settings: {},
      state: p.state,
    };
    this.players.set(rec.id, rec);
    return rec;
  }

  async updatePlayer(
    playerId: string,
    patch: { name?: string; avatar?: string | null; isDuo?: boolean },
  ) {
    const cur = this.players.get(playerId);
    if (!cur) return undefined;
    const next = {
      ...cur,
      name: patch.name ?? cur.name,
      avatar: patch.avatar === undefined ? cur.avatar : patch.avatar,
      isDuo: patch.isDuo ?? cur.isDuo,
    };
    this.players.set(playerId, next);
    return next;
  }
}
