import { useEffect, useState } from 'react';
import { call, type Paper } from '../api';
import { useSession } from '../store';
import { DailyPuzzle } from './DailyPuzzle';
import { Issue } from '../ui/Issue';

/** "Der Bergbote": start screen of every day. Older issues stay readable. */
export function Newspaper() {
  const { view, playerId } = useSession();
  const latest = view?.newspaper_days ?? 0;
  const [day, setDay] = useState<number | null>(null);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [error, setError] = useState('');

  const shown = day ?? Math.max(1, Math.min(view?.day ?? 1, latest));
  // the puzzle of every readable issue stays solvable
  const hasPuzzle = !!view?.daily_puzzles.some((d) => d.day === shown);

  useEffect(() => {
    if (!playerId || latest < 1) return;
    let alive = true;
    setPaper(null);
    setError('');
    void call<{ newspaper: Paper }>('newspaper', { player_id: playerId, day: shown }).then((r) => {
      if (!alive) return;
      if (r.ok) setPaper(r.newspaper);
      else setError(r.message);
    });
    return () => {
      alive = false;
    };
  }, [playerId, shown, latest]);

  if (latest < 1)
    return <p>Das Hotel öffnet am 1. Dezember. Dann gibt es hier die erste Zeitung.</p>;

  return (
    <article className="paper">
      <header className="masthead">
        <p className="topline">Unabhängig · Berghotel Edelweiß · Preis: eine Schneeflocke</p>
        <h1>Der Bergbote</h1>
        <div className="rule" aria-hidden="true" />
        <p className="issue">
          Ausgabe Nr. {shown} · {dateOf(view?.start_date, shown)}
        </p>
        {paper?.weather && <p className="weather">🌨️ Wetter: {paper.weather}</p>}
      </header>
      <div className="issuenav" role="group" aria-label="Ausgabe wählen">
        <button
          disabled={shown <= 1}
          onClick={() => setDay(shown - 1)}
          aria-label="Vorherige Ausgabe"
        >
          ◀ Zurück
        </button>
        <strong>Tag {shown}</strong>
        <button
          disabled={shown >= latest}
          onClick={() => setDay(shown + 1)}
          aria-label="Nächste Ausgabe"
        >
          Weiter ▶
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {!paper && !error && <p role="status">Die Zeitung wird gedruckt …</p>}
      {paper && (
        <div key={shown} className="sheet">
          <Issue
            p={paper}
            riddle={
              hasPuzzle && (
                <section className="box riddle" aria-label="Rätsel-Ecke">
                  <DailyPuzzle day={shown} />
                </section>
              )
            }
          />
        </div>
      )}
    </article>
  );
}

const dateOf = (start: string | undefined, day: number): string => {
  if (!start) return '';
  const d = new Date(`${start}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day - 1);
  return d.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};
