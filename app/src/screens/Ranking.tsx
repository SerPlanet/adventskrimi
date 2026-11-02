import { useEffect, useState } from 'react';
import { call } from '../api';
import { useSession } from '../store';

interface Row {
  name: string;
  avatar: string | null;
  points: number;
  plaques: number;
  plaque_titles: string[];
  rank: string;
  is_you: boolean;
}

/** Rangliste: everybody with name; own row and neighbours stand out. No bar towards the solution. */
export function Ranking() {
  const { playerId, view } = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!playerId) return;
    void call<{ rows: Row[] }>('scoreboard', { player_id: playerId }).then((r) =>
      r.ok ? setRows(r.rows) : setError(r.message),
    );
  }, [playerId, view?.points]);

  const me = rows?.findIndex((r) => r.is_you) ?? -1;
  const above = me > 0 ? rows?.[me - 1] : undefined;

  return (
    <>
      <h1>Rangliste</h1>
      {error && <p role="alert">{error}</p>}
      {!rows && !error && <p role="status">Die Liste wird geladen …</p>}
      {above && rows && (
        <p className="card" role="status">
          Du bist {above.points - (rows[me]?.points ?? 0)} Punkte hinter {above.name}.
        </p>
      )}
      {rows && (
        <ol className="rank">
          {rows.map((r, i) => (
            <li
              key={r.name + i}
              className={r.is_you ? 'you' : Math.abs(i - me) === 1 ? 'next' : ''}
            >
              <span className="pos">{i + 1}.</span>
              <span aria-hidden="true">{r.avatar ?? '🙂'}</span>
              <span className="name">
                {r.name}
                {r.is_you && <strong> (du)</strong>}
              </span>
              <span className="rk">{r.rank}</span>
              <span className="pts">
                {r.points} Punkte{r.plaques > 0 ? ` · 🏅 ${r.plaques}` : ''}
              </span>
              {r.plaque_titles.length > 0 && (
                <span className="titles">Plaketten: {r.plaque_titles.join(', ')}</span>
              )}
            </li>
          ))}
        </ol>
      )}
      <MyPoints />
    </>
  );
}

/** "Meine Punkte": where the points came from. */
function MyPoints() {
  const { view } = useSession();
  if (!view) return null;
  return (
    <section className="card" aria-labelledby="mp">
      <h2 id="mp">Meine Punkte: {view.points}</h2>
      {view.breakdown.length === 0 ? (
        <p>Noch keine Punkte. Sie kommen beim Spielen von allein.</p>
      ) : (
        <ul className="plain">
          {view.breakdown.map((b) => (
            <li key={b.kind}>
              {b.label}: <strong>{b.points}</strong>
              {b.count > 1 ? <small> ({b.count}×)</small> : null}
            </li>
          ))}
        </ul>
      )}
      <p className="small">
        Es gibt nie Minuspunkte. Ein Tipp halbiert nur die Punkte dieser einen Sache.
      </p>
    </section>
  );
}
