import { useEffect, useState } from 'react';
import { call } from '../api';
import { useSession } from '../store';

interface Row {
  name: string;
  avatar: string | null;
  points: number;
  plaques: number;
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
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
