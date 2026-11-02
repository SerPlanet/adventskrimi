import { useState } from 'react';
import { useSession } from '../store';
import type { View } from '../api';

type Claim = View['notes']['claims'][number];

/** Row of a card: the person, or the object for object states. */
const ownerOf = (c: Claim): string | undefined =>
  c.body ? ('person' in c.body ? c.body.person : c.body.object) : undefined;

/** Zeitstrahl: per person a list of time windows. Pick a card, then tap its field. */
export function Timeline() {
  const { view, setNote, fits } = useSession();
  const [picked, setPicked] = useState<string | null>(null);
  const [pair, setPair] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  if (!view) return null;
  const level = view.player.settings.note_level ?? 'half';
  const { claims, placed, suggestions, contradictions } = view.notes;
  const byKey = new Map(claims.map((c) => [c.key, c]));
  const bad = new Set(contradictions.flatMap((c) => [c.a, c.b]));
  const windows = view.options.when;
  const rooms = new Map(view.map.rooms.map((r) => [r.id, r.name]));
  const finds = new Map(view.finds.map((f) => [f.id, f]));

  const label = (c: Claim) => {
    const b = c.body;
    const text = finds.get(c.item)?.text ?? '';
    if (b && (b.type === 'presence' || b.type === 'absence'))
      return `${b.type === 'absence' ? 'Nicht in' : 'In'} ${rooms.get(b.room) ?? b.room}. ${text}`;
    return text;
  };
  const shape = (c: Claim) => (c.kind === 'fact' ? '🔍 Fakt' : '💬 Aussage');
  const cardsFor = (person: string, window?: string) =>
    placed
      .map((k) => byKey.get(k))
      .filter(
        (c): c is Claim => !!c && !!c.body && ownerOf(c) === person && c.body.window === window,
      );
  const unplaced = claims.filter((c) => !placed.includes(c.key) && c.body);
  const sel = picked ? byKey.get(picked) : undefined;
  const fitsHere = (person: string, window?: string) =>
    !!sel?.body && ownerOf(sel) === person && sel.body.window === window;

  const ask = async () => {
    const [a, b] = pair;
    if (!a || !b) return;
    const r = await fits(a, b);
    setAnswer(
      r === null ? '' : r ? '✓ Ja, das passt zusammen.' : '✗ Nein, das passt nicht zusammen.',
    );
  };

  return (
    <section role="tabpanel" aria-label="Zeitstrahl">
      <p className="small">
        Wähle eine Karte, dann das passende Feld. 🔍 Fakten haben eine feste Umrandung, 💬 Aussagen
        eine gestrichelte.
      </p>
      {contradictions.length > 0 && (
        <div className="card" role="alert">
          <h2>⚠️ Passt nicht</h2>
          <ul className="plain">
            {contradictions.map((c) => (
              <li key={c.a + c.b}>{c.text}</li>
            ))}
          </ul>
        </div>
      )}
      {level === 'half' && suggestions.length > 0 && (
        <p className="small">
          Vorschläge: {suggestions.length} Karten warten unten bei „Karten zum Einsortieren“.
        </p>
      )}

      <h2>Karten zum Einsortieren</h2>
      {unplaced.length === 0 && <p>Keine Karten übrig.</p>}
      <ul className="plain">
        {unplaced.map((c) => (
          <li key={c.key}>
            <button
              className={`cardbtn ${c.kind}`}
              aria-pressed={picked === c.key}
              onClick={() => setPicked(picked === c.key ? null : c.key)}
            >
              {shape(c)}: {label(c)}
            </button>
          </li>
        ))}
      </ul>

      {[
        ...view.people,
        ...[
          ...new Set(claims.flatMap((c) => (c.body && 'object' in c.body ? [c.body.object] : []))),
        ]
          .filter((o): o is string => !!o)
          .map((o) => ({ id: o, name: `Gegenstand: ${o}` })),
      ].map((p) => (
        <div key={p.id} className="card">
          <h2>{p.name}</h2>
          <ul className="plain">
            {windows.map((w) => {
              const cards = cardsFor(p.id, w.id);
              return (
                <li key={w.id}>
                  <h3>{w.name}</h3>
                  {cards.map((c) => (
                    <div key={c.key} className={`slot ${c.kind} ${bad.has(c.key) ? 'bad' : ''}`}>
                      {bad.has(c.key) && <strong>⚠️ Passt nicht: </strong>}
                      {shape(c)}: {label(c)}
                      <div className="row wrap">
                        {level === 'manual' && (
                          <label className="radio">
                            <input
                              type="checkbox"
                              checked={pair.includes(c.key)}
                              onChange={(e) =>
                                setPair(
                                  e.target.checked
                                    ? [...pair, c.key].slice(-2)
                                    : pair.filter((k) => k !== c.key),
                                )
                              }
                            />
                            Vergleichen
                          </label>
                        )}
                        {level !== 'auto' && (
                          <button
                            onClick={() => setNote({ kind: 'timeline', key: c.key, put: false })}
                          >
                            Entfernen
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {sel && fitsHere(p.id, w.id) && (
                    <button
                      onClick={async () => {
                        if (await setNote({ kind: 'timeline', key: sel.key, put: true }))
                          setPicked(null);
                      }}
                    >
                      ➕ Hierhin legen
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {level === 'manual' && (
        <div className="card">
          <h2>Passt das zusammen?</h2>
          <p className="small">Hake zwei Einträge an. Die Antwort ist gratis.</p>
          <button disabled={pair.length !== 2} onClick={ask}>
            Prüfen
          </button>
          <p role="status">{answer}</p>
        </div>
      )}
    </section>
  );
}
