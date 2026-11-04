import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { adminCall, clockNow, setClock } from '../api';

interface Game {
  id: string;
  slug: string;
  name: string;
  profile: string;
  startDate: string;
}
interface Row {
  id: string;
  name: string;
  avatar: string | null;
  is_duo: boolean;
  day: number;
  days_finished: number;
  finds: number;
  filed: number;
  points: number;
  accused: boolean;
  accused_day: number | null;
}
interface Overview {
  now: string;
  today: number;
  game: { name: string; profile: string; start_date: string };
  players: Row[];
}

const TOKEN = 'advent.admin';
const read = () => {
  try {
    return sessionStorage.getItem(TOKEN) ?? '';
  } catch {
    return '';
  }
};

/**
 * Observer page (WP11): behind a secret token, not linked anywhere. Shows counts and flags only,
 * never a theory, a find or the solution. Staging has the test clock; the server refuses it in prod.
 */
export function Admin() {
  const [token, setToken] = useState(read());
  const [games, setGames] = useState<Game[] | null>(null);
  const [game, setGame] = useState('');
  const [ov, setOv] = useState<Overview | null>(null);
  const [msg, setMsg] = useState('');
  const [clock, setClockText] = useState(clockNow() ?? '');

  const load = useCallback(
    async (id: string) => {
      const r = await adminCall<Overview>(token, { op: 'overview', game_id: id });
      if (r.ok) setOv(r);
      else setMsg(r.message);
    },
    [token],
  );

  const login = async (e: FormEvent) => {
    e.preventDefault();
    const r = await adminCall<{ games: Game[] }>(token, { op: 'games' });
    if (!r.ok) return setMsg(r.message);
    try {
      sessionStorage.setItem(TOKEN, token);
    } catch {
      /* the token is simply asked for again */
    }
    setMsg('');
    setGames(r.games);
    if (r.games[0]) setGame(r.games[0].id);
  };

  useEffect(() => {
    if (game) void load(game);
  }, [game, load]);

  const run = async (body: object, done: string) => {
    const r = await adminCall(token, body);
    setMsg(r.ok ? done : r.message);
    if (r.ok && game) await load(game);
  };

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    await run(
      {
        op: 'create',
        game_id: game,
        player: {
          name: String(f.get('name')),
          avatar: String(f.get('avatar') || '') || null,
          is_duo: f.get('duo') === 'on',
        },
      },
      'Spieler angelegt.',
    );
    form.reset();
  };

  const exportJson = () => {
    const a = document.createElement('a');
    const blob = new Blob([JSON.stringify(ov, null, 2)], { type: 'application/json' });
    a.href = URL.createObjectURL(blob);
    a.download = `uebersicht-${ov?.game.name ?? 'spiel'}.json`;
    a.click();
  };

  if (!games)
    return (
      <main id="main" className="wrap">
        <h1>Verwaltung</h1>
        <form onSubmit={login}>
          <label>
            Admin-Token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button className="primary" disabled={!token}>
            Anmelden
          </button>
        </form>
        <p role="alert">{msg}</p>
      </main>
    );

  return (
    <main id="main" className="wrap">
      <h1>Verwaltung</h1>
      <label>
        Spiel
        <select value={game} onChange={(e) => setGame(e.target.value)}>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.slug})
            </option>
          ))}
        </select>
      </label>
      {ov && (
        <>
          <p>
            <strong>Heute ist Tag {ov.today}.</strong> Systemzeit:{' '}
            {new Date(ov.now).toLocaleString('de-DE')} · Profil {ov.game.profile} · Start{' '}
            {ov.game.start_date}
          </p>
          <div className="tablewrap">
            <table className="timetable">
              <caption className="sr">Spieler</caption>
              <thead>
                <tr>
                  {[
                    'Spieler',
                    'Tag',
                    'Tage beendet',
                    'Funde',
                    'In der Akte',
                    'Punkte',
                    'Anklage',
                  ].map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ov.players.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">
                      {p.avatar ?? ''} {p.name}
                      {p.is_duo ? ' (Duo)' : ''}
                    </th>
                    <td>{Math.min(p.day, 24)}</td>
                    <td>{p.days_finished}</td>
                    <td>{p.finds}</td>
                    <td>{p.filed}</td>
                    <td>{p.points}</td>
                    <td>{p.accused ? `Tag ${p.accused_day ?? '?'}` : 'nein'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row wrap">
            <button onClick={exportJson}>Export (JSON)</button>
            <button onClick={() => void load(game)}>Aktualisieren</button>
          </div>

          <h2>Spieler anlegen</h2>
          <form onSubmit={add}>
            <label>
              Name
              <input name="name" required maxLength={40} />
            </label>
            <label>
              Symbol (Emoji)
              <input name="avatar" maxLength={8} />
            </label>
            <label className="radio">
              <input type="checkbox" name="duo" /> Duo (zwei Personen)
            </label>
            <button className="primary">Anlegen</button>
          </form>

          <h2>Zeitung neu erzeugen</h2>
          <p className="small">
            Bildet die Zeitung eines Tages neu aus dem Fall. Punkte ändern sich nie.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const day = Number(new FormData(e.currentTarget).get('day'));
              void run(
                { op: 'regen_paper', game_id: game, day },
                `Zeitung von Tag ${day} wird neu erzeugt.`,
              );
            }}
          >
            <label>
              Tag
              <input
                name="day"
                type="number"
                min={1}
                max={24}
                defaultValue={ov.today > 0 ? Math.min(ov.today, 24) : 1}
              />
            </label>
            <button>Neu erzeugen</button>
          </form>

          <h2>Zeitraffer (nur Staging)</h2>
          <p className="small">
            Gilt nur für diesen Tab. In der Produktion lehnt der Server das ab.
          </p>
          <label>
            Datum und Uhrzeit
            <input
              value={clock}
              placeholder="2026-12-24T12:00:00+01:00"
              onChange={(e) => setClockText(e.target.value)}
            />
          </label>
          <div className="row wrap">
            <button
              onClick={() => {
                setClock(clock.trim() || null);
                void load(game);
              }}
            >
              Setzen
            </button>
            <button
              onClick={() => {
                setClock(null);
                setClockText('');
                void load(game);
              }}
            >
              Echte Zeit
            </button>
          </div>
        </>
      )}
      <p role="status">{msg}</p>
    </main>
  );
}
