import { useState } from 'react';
import { useSession } from '../store';
import { Story } from './Story';

const CATS = [
  ['who', 'Wer war der Dieb?'],
  ['accomplice', 'Wer hat geholfen (Komplize)?'],
  ['when', 'Wann ist es passiert?'],
  ['where', 'Wo ist es passiert?'],
] as const;

/** Theory page: four fields, saved on demand; later the accusation with a confirmation step. */
export function Theory() {
  const { view, setTheory, accuse } = useSession();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [proof, setProof] = useState<Record<string, string[]>>({});
  const [confirm, setConfirm] = useState(false);
  if (!view) return null;
  const locked = view.accusation.done;
  const value = (k: string) => draft[k] ?? (view.theory as Record<string, string>)[k] ?? '';
  const dirty = CATS.some(([k]) => value(k) !== ((view.theory as Record<string, string>)[k] ?? ''));
  const complete = CATS.every(([k]) => value(k));
  const toggle = (q: string, o: string) => {
    const cur = proof[q] ?? [];
    setProof({ ...proof, [q]: cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o] });
  };

  return (
    <>
      <h1>Deine Theorie</h1>
      <p className="small">Nur du siehst sie. Du kannst sie jederzeit ändern.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const patch = Object.fromEntries(
            CATS.map(([k]) => [k, value(k) || null] as const).filter(
              ([k, v]) => v !== ((view.theory as Record<string, string>)[k] ?? null),
            ),
          );
          if (await setTheory(patch)) setDraft({});
        }}
      >
        {CATS.map(([k, title]) => (
          <label key={k}>
            {title}
            <select
              value={value(k)}
              disabled={locked}
              onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
            >
              <option value="">Noch offen</option>
              {view.options[k].map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        {!locked && (
          <button type="submit" disabled={!dirty}>
            Theorie speichern
          </button>
        )}
      </form>

      {view.theory_history.length > 0 && (
        <details>
          <summary>Verlauf deiner Theorie ({view.theory_history.length})</summary>
          <ul className="plain">
            {[...view.theory_history].reverse().map((h, i) => (
              <li key={i}>
                Tag {h.day}:{' '}
                {CATS.map(([k]) => {
                  const id = (h.theory as Record<string, string>)[k];
                  return view.options[k].find((o) => o.id === id)?.name ?? '–';
                }).join(' · ')}
              </li>
            ))}
          </ul>
        </details>
      )}

      {view.reports.length > 0 && (
        <section className="card">
          <h2>Zeugnisse vom Inspektor</h2>
          {view.reports.map((r) => (
            <p key={r.day}>
              📋 Tag {r.day}: {r.sentence}
            </p>
          ))}
        </section>
      )}

      {view.story && <Story />}

      {locked && !view.story && (
        <section className="card" role="status">
          <h2>⚖️ Anklage abgegeben</h2>
          <p>Du kannst nichts mehr ändern. Die Auflösung gibt es ab Tag 24.</p>
        </section>
      )}

      {view.accusation.can && (
        <section className="card">
          <h2>Anklage erheben</h2>
          <p>
            Wenn du sicher bist, kannst du anklagen. Danach kannst du nichts mehr ändern. Es gibt
            keine Strafe, wenn etwas falsch ist.
          </p>
          {view.accusation.proof_questions.map((q) => (
            <fieldset key={q.id}>
              <legend>{q.text} (mehrere möglich)</legend>
              {q.options.map((o) => (
                <label key={o.id} className="radio">
                  <input
                    type="checkbox"
                    checked={(proof[q.id] ?? []).includes(o.id)}
                    onChange={() => toggle(q.id, o.id)}
                  />
                  {o.text}
                </label>
              ))}
            </fieldset>
          ))}
          {!confirm ? (
            <button disabled={!complete || dirty} onClick={() => setConfirm(true)}>
              Anklage erheben …
            </button>
          ) : (
            <div role="alertdialog" aria-label="Anklage bestätigen" className="card">
              <p>
                <strong>Bist du sicher?</strong> Deine Theorie und deine Antworten sind danach
                endgültig.
              </p>
              <div className="row wrap">
                <button
                  onClick={async () => {
                    await accuse(view.theory as Record<string, string>, proof);
                    setConfirm(false);
                  }}
                >
                  Ja, ich klage an
                </button>
                <button className="link" onClick={() => setConfirm(false)}>
                  Nein, zurück
                </button>
              </div>
            </div>
          )}
          {(!complete || dirty) && (
            <p className="small">Speichere zuerst eine vollständige Theorie (alle vier Felder).</p>
          )}
        </section>
      )}
      {!view.accusation.can && !locked && (
        <p className="small">Die Anklage ist ab Tag {view.accusation.from_day} möglich.</p>
      )}
    </>
  );
}
