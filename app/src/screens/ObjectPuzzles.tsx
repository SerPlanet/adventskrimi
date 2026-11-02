import { useState } from 'react';
import { useSession } from '../store';

/** Object puzzles of the current room: a lock in front of a source. Tips never cost points. */
export function ObjectPuzzles({ disabled }: { disabled: boolean }) {
  const { view, objectPuzzle, busy } = useSession();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const list = view?.puzzles ?? [];
  if (!list.length) return null;
  const say = (id: string, m: string) => setMsgs((x) => ({ ...x, [id]: m }));

  return (
    <>
      <h2>Rätsel im Raum</h2>
      {list.map((p) => (
        <section className="card" key={p.id} aria-labelledby={`pz-${p.id}`}>
          <h3 id={`pz-${p.id}`}>🔒 Schloss {p.solved && '(offen ✅)'}</h3>
          <p>{p.prompt}</p>
          {p.hints.map((h, i) => (
            <p key={h}>
              💡 Tipp {i + 1}: {h}
            </p>
          ))}
          {!p.solved && (
            <>
              <label>
                Deine Antwort
                <input
                  type="text"
                  value={answers[p.id] ?? ''}
                  disabled={disabled}
                  onChange={(e) => setAnswers({ ...answers, [p.id]: e.target.value })}
                />
              </label>
              <div className="row wrap">
                <button
                  className="primary"
                  disabled={disabled || busy || !(answers[p.id] ?? '').trim()}
                  onClick={async () => {
                    const r = await objectPuzzle(p.id, 'check', answers[p.id]);
                    say(
                      p.id,
                      r?.correct
                        ? 'Das Schloss springt auf! Jetzt kannst du es untersuchen.'
                        : 'Das passt noch nicht. Versuch es gern noch einmal.',
                    );
                  }}
                >
                  Ausprobieren
                </button>
                <button
                  disabled={disabled || busy}
                  onClick={async () => {
                    const r = await objectPuzzle(p.id, 'hint');
                    if (r?.hint && p.hints.length >= 2) say(p.id, `Lösung: ${r.hint}`);
                  }}
                >
                  {p.hints.length === 0
                    ? 'Tipp 1'
                    : p.hints.length === 1
                      ? 'Tipp 2'
                      : 'Lösung zeigen'}
                </button>
              </div>
            </>
          )}
          <p role="status">{msgs[p.id]}</p>
        </section>
      ))}
    </>
  );
}
