import { useSession } from '../store';

const CATS = [
  ['who', 'Wer war der Dieb?'],
  ['accomplice', 'Wer war der Komplize?'],
  ['when', 'Wann war es?'],
  ['where', 'Wo war es?'],
] as const;

const MARKS = {
  none: { sym: '?', text: 'unklar' },
  no: { sym: '✗', text: 'ausgeschlossen' },
  yes: { sym: '✓', text: 'sicher' },
} as const;

/** Raster: one list per question; tap a row to cycle ? → ✗ → ✓. Symbols plus words, never colour alone. */
export function Grid() {
  const { view, setNote } = useSession();
  if (!view) return null;
  const level = view.player.settings.note_level ?? 'half';
  const { grid, grid_suggestions: sug } = view.notes;
  const name = (cat: (typeof CATS)[number][0], id: string) =>
    view.options[cat].find((o) => o.id === id)?.name ?? id;

  return (
    <section role="tabpanel" aria-label="Raster">
      <p className="small">
        {level === 'auto' && 'Das Hotel trägt sichere Ausschlüsse für dich ein.'}
        {level === 'half' && 'Das Hotel macht Vorschläge. Du entscheidest.'}
        {level === 'manual' && 'Du trägst alles selbst ein.'} Tippe eine Zeile, um zu wechseln: ?
        unklar, ✗ ausgeschlossen, ✓ sicher.
      </p>
      {sug.length > 0 && (
        <div className="card">
          <h2>Vorschläge</h2>
          <ul className="plain">
            {sug.map((s) => (
              <li key={s.cat + s.candidate} className="row between">
                <span>✗ {name(s.cat, s.candidate)} ausschließen</span>
                <button
                  onClick={() =>
                    setNote({ kind: 'grid', cat: s.cat, candidate: s.candidate, mark: 'no' })
                  }
                >
                  Übernehmen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {CATS.map(([cat, title]) => (
        <fieldset key={cat}>
          <legend>{title}</legend>
          <ul className="plain">
            {view.options[cat].map((o) => {
              const m = grid[`${cat}:${o.id}`];
              const cur = m ?? 'none';
              const next = cur === 'none' ? 'no' : cur === 'no' ? 'yes' : null;
              return (
                <li key={o.id}>
                  <button
                    className="gridrow"
                    aria-label={`${o.name}: ${MARKS[cur].text}. Tippen zum Wechseln.`}
                    onClick={() => setNote({ kind: 'grid', cat, candidate: o.id, mark: next })}
                  >
                    <span aria-hidden="true" className="mark">
                      {MARKS[cur].sym}
                    </span>{' '}
                    {o.name} <span className="small">({MARKS[cur].text})</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
    </section>
  );
}
