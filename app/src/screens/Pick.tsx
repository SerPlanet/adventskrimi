import { useEffect, useState } from 'react';
import { call, memory } from '../api';
import { useSession } from '../store';

interface Tile {
  id: string;
  name: string;
  avatar: string | null;
}

/** Name tiles of the game chosen by the link. No password, one tap; the last player is highlighted. */
export function Pick({ slug }: { slug: string }) {
  const { login } = useSession();
  const lastKey = `advent.lastPlayer.${slug}`;
  const [tiles, setTiles] = useState<Tile[] | null>(null);
  const [title, setTitle] = useState('Berghotel Edelweiß');
  const [error, setError] = useState('');
  const [last] = useState(() => memory.get(lastKey));

  useEffect(() => {
    void call<{ game: { name: string }; players: Tile[] }>('lobby', {}).then((r) => {
      if (!r.ok) return setError(r.message);
      setTitle(r.game.name);
      setTiles(r.players);
    });
  }, [slug]);

  const choose = (id: string) => {
    memory.set(lastKey, id);
    login(id);
  };

  return (
    <main id="main" className="pick">
      <h1>{title}</h1>
      <p>Willkommen, Detektiv! Wer bist du?</p>
      {error && <p role="alert">{error}</p>}
      {!tiles && !error && <p role="status">Einen Moment …</p>}
      {tiles && (
        <section aria-label="Spieler wählen">
          <ul className="tiles">
            {tiles.map((t) => (
              <li key={t.id}>
                <button
                  className={`tile${t.id === last ? ' last' : ''}`}
                  onClick={() => choose(t.id)}
                >
                  <span className="avatar" aria-hidden="true">
                    {t.avatar ?? '🙂'}
                  </span>
                  {t.name}
                  {t.id === last && <small>Zuletzt hier</small>}
                </button>
              </li>
            ))}
          </ul>
          {tiles.length === 0 && <p>In diesem Spiel gibt es noch keine Spieler.</p>}
        </section>
      )}
    </main>
  );
}
