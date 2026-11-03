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
          <Issue p={paper} />
        </div>
      )}
      {shown === view?.day && (view?.question || view?.daily_puzzle) && (
        <div className="corners corner">
          {view.daily_puzzle && (
            <section className="box" aria-label="Rätsel-Ecke">
              <DailyPuzzle />
            </section>
          )}
          {view.question && <Question />}
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

function Question() {
  const { view, answer, hint } = useSession();
  const [msg, setMsg] = useState('');
  const q = view?.question;
  if (!q) return null;

  const pick = async (id: string) => {
    const status = await answer(id);
    setMsg(
      status === 'correct'
        ? 'Richtig! Gut gelesen.'
        : status === 'wrong'
          ? 'Das stimmt leider nicht. Du hast noch einen Versuch.'
          : status === 'failed'
            ? 'Das war leider nicht richtig. Morgen gibt es eine neue Frage.'
            : '',
    );
  };

  return (
    <section className="box" aria-labelledby="q-title">
      <h2 id="q-title">Leserfrage des Tages</h2>
      <p>{q.text}</p>
      {q.done ? (
        <p role="status">
          {q.correct
            ? '✅ Richtig beantwortet.'
            : '❌ Diesmal nicht richtig. Das ist nicht schlimm.'}
        </p>
      ) : (
        <>
          <ul className="options">
            {q.options.map((o) => (
              <li key={o.id}>
                <button onClick={() => void pick(o.id)}>{o.text}</button>
              </li>
            ))}
          </ul>
          <p>Versuche übrig: {q.attempts_left}</p>
          {q.can_hint && !q.hint && (
            <button
              className="link"
              onClick={async () => setMsg((await hint()) ?? '')}
              aria-describedby="hint-note"
            >
              Tipp zeigen
            </button>
          )}
          <p id="hint-note" className="small">
            Mit Tipp gibt es für diese Frage nur halbe Punkte.
          </p>
        </>
      )}
      {q.hint && !q.done && <p>💡 Tipp: {q.hint}</p>}
      <p role="status">{msg}</p>
    </section>
  );
}
