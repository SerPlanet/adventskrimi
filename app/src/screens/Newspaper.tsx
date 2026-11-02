import { useEffect, useState } from 'react';
import { call, type Paper } from '../api';
import { useSession } from '../store';
import { DailyPuzzle } from './DailyPuzzle';

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
        <h1>Der Bergbote</h1>
        <p className="issue">
          Ausgabe Nr. {shown} · {dateOf(view?.start_date, shown)}
        </p>
      </header>
      <div className="row between" role="group" aria-label="Ausgabe wählen">
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
      {view?.question && shown === view.day && <Question />}
      {view?.daily_puzzle && shown === view.day && <DailyPuzzle />}
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

function Issue({ p }: { p: Paper }) {
  return (
    <>
      <section className="lead">
        <h2 className="headline">{p.headline}</h2>
        <p className="columns">{p.text}</p>
        <div className="boxes">
          {p.weather && <p className="box">🌨️ Wetter: {p.weather}</p>}
          {p.blocked_rooms.length > 0 && (
            <p className="box">⛔ Gesperrt: {p.blocked_rooms.join(', ')}</p>
          )}
          {p.bonus_rooms.length > 0 && (
            <p className="box">⭐ Heute offen: {p.bonus_rooms.join(', ')}</p>
          )}
        </div>
      </section>
      {p.gossip.length > 0 && (
        <section className="card">
          <h2>Klatsch und Tratsch</h2>
          {p.gossip.map((g) => (
            <p key={g}>💬 {g}</p>
          ))}
        </section>
      )}
      {p.rumors.length > 0 && (
        <section className="card">
          <h2>Gerüchte</h2>
          {p.rumors.map((g) => (
            <p key={g}>👂 {g}</p>
          ))}
        </section>
      )}
      {p.ads.length > 0 && (
        <section className="card">
          <h2>Anzeigen</h2>
          {p.ads.map((g) => (
            <p key={g}>📌 {g}</p>
          ))}
        </section>
      )}
      {(p.plaques.length > 0 || p.detective_of_day || p.accusations?.length) && (
        <section className="card">
          <h2>Gästebuch</h2>
          {p.accusations?.map((name) => (
            <p key={name}>⚖️ {name} hat Anklage erhoben.</p>
          ))}
          {p.plaques.map((x) => (
            <p key={x.title + x.player} className="stamp">
              🏅 {x.player} hat etwas als Erste/r entdeckt: „{x.title}“.
            </p>
          ))}
          {p.detective_of_day && (
            <p>
              🕵️ Ermittler des Tages: {p.detective_of_day.name} ({p.detective_of_day.points} Punkte)
            </p>
          )}
        </section>
      )}
      {p.filler.map((f) => (
        <p key={f}>{f}</p>
      ))}
    </>
  );
}

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
    <section className="card" aria-labelledby="q-title">
      <h2 id="q-title">Frage des Tages</h2>
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
