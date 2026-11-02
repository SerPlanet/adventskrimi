import { useEffect, useState } from 'react';
import { useSession } from '../store';

type Daily = NonNullable<ReturnType<typeof useSession>['view']>['daily_puzzle'];

const LEVEL = { easy: 'leicht', medium: 'mittel', hard: 'schwer' } as const;

/** Sudoku: tap a cell, then a number. Clue cells are fixed. */
function Sudoku({
  d,
  cells,
  setCells,
  disabled,
}: {
  d: { n: number; br: number; bc: number; cells: number[] };
  cells: number[];
  setCells: (c: number[]) => void;
  disabled: boolean;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const put = (v: number) => {
    if (sel === null || d.cells[sel] !== 0) return;
    const next = [...cells];
    next[sel] = v;
    setCells(next);
  };
  return (
    <div onKeyDown={(e) => /^[1-9]$/.test(e.key) && Number(e.key) <= d.n && put(Number(e.key))}>
      <div
        className="sudoku"
        style={{ gridTemplateColumns: `repeat(${d.n}, 1fr)`, maxWidth: `${d.n * 2.4}rem` }}
        role="grid"
        aria-label="Zahlenfeld"
      >
        {cells.map((v, i) => {
          const r = Math.floor(i / d.n);
          const c = i % d.n;
          const fixed = d.cells[i] !== 0;
          const edge = `${(c + 1) % d.bc === 0 && c < d.n - 1 ? ' bR' : ''}${(r + 1) % d.br === 0 && r < d.n - 1 ? ' bB' : ''}`;
          return (
            <button
              key={i}
              role="gridcell"
              className={`cell${fixed ? ' fixed' : ''}${sel === i ? ' sel' : ''}${edge}`}
              aria-label={`Zeile ${r + 1}, Spalte ${c + 1}, ${v ? `Zahl ${v}` : 'leer'}${fixed ? ', vorgegeben' : ''}`}
              aria-pressed={sel === i}
              disabled={disabled}
              onClick={() => setSel(i)}
            >
              {v || ''}
            </button>
          );
        })}
      </div>
      <div className="pad" role="group" aria-label="Zahlen">
        {Array.from({ length: d.n }, (_, k) => k + 1).map((n) => (
          <button key={n} disabled={disabled || sel === null} onClick={() => put(n)}>
            {n}
          </button>
        ))}
        <button
          disabled={disabled || sel === null}
          onClick={() => put(0)}
          aria-label="Zahl löschen"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}

/** One frame for all kinds: prompt, play field, tip, skip, check. Wrong answers cost nothing. */
export function DailyPuzzle() {
  const { view, daily, busy } = useSession();
  const p = view?.daily_puzzle as Daily;
  const [text, setText] = useState('');
  const [cells, setCells] = useState<number[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const key = p ? `${p.kind}:${p.level}:${view?.day}` : '';

  useEffect(() => {
    if (!p) return;
    setMsg('');
    setText('');
    setCells(p.kind === 'sudoku' ? [...(p.data as { cells: number[] }).cells] : []);
    setRooms(p.kind === 'logic' ? Array((p.data as { rooms: number }).rooms).fill('') : []);
  }, [key]);

  if (!p) return null;
  const closed = p.done;
  const attempt =
    p.kind === 'sudoku' ? cells.join('') : p.kind === 'logic' ? rooms.join(',') : text;
  const ready =
    p.kind === 'sudoku'
      ? cells.every((c) => c > 0)
      : p.kind === 'logic'
        ? rooms.every(Boolean)
        : text.trim() !== '';

  const check = async () => {
    const r = await daily('check', attempt);
    setMsg(
      r?.outcome === 'correct'
        ? 'Richtig! Das hast du gut gelöst.'
        : r?.outcome === 'wrong'
          ? 'Das stimmt noch nicht. Versuch es gern noch einmal. Das kostet nichts.'
          : '',
    );
  };

  return (
    <section className="card" aria-labelledby="dp-title">
      <h2 id="dp-title">
        Rätsel des Tages: {p.title} <small>({LEVEL[p.level]})</small>
      </h2>
      <p>{p.prompt}</p>

      {p.kind === 'sudoku' && (
        <Sudoku d={p.data as never} cells={cells} setCells={setCells} disabled={closed || busy} />
      )}
      {p.kind === 'word' && (
        <p
          className="letters"
          aria-label={`Buchstaben: ${(p.data as { letters: string[] }).letters.join(' ')}`}
        >
          {(p.data as { letters: string[] }).letters.map((l, i) => (
            <span key={i} aria-hidden="true">
              {l}
            </span>
          ))}
        </p>
      )}
      {p.kind === 'logic' && (
        <>
          <ul>
            {(p.data as { clues: string[] }).clues.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {rooms.map((v, i) => (
            <label key={i}>
              Zimmer {i + 1}
              <select
                value={v}
                disabled={closed}
                onChange={(e) => setRooms(rooms.map((x, j) => (j === i ? e.target.value : x)))}
              >
                <option value="">Bitte wählen</option>
                {(p.data as { names: string[] }).names.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          ))}
        </>
      )}
      {(p.kind === 'word' || p.kind === 'number') && (
        <label>
          Deine Antwort
          <input
            type="text"
            inputMode={p.kind === 'number' ? 'numeric' : 'text'}
            value={text}
            disabled={closed}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ready && void check()}
          />
        </label>
      )}

      {p.hints.map((h, i) => (
        <p key={h}>
          💡 Tipp {i + 1}: {h}
        </p>
      ))}
      {p.solution && <p>🔑 Lösung: {p.solution}</p>}
      {closed ? (
        <p role="status">
          {p.solved ? '✅ Gelöst.' : 'Das Rätsel ist beendet. Morgen gibt es ein neues.'}
        </p>
      ) : (
        <>
          <div className="row wrap">
            <button className="primary" disabled={busy || !ready} onClick={() => void check()}>
              Prüfen
            </button>
            <button
              disabled={busy}
              onClick={async () =>
                setMsg((await daily('hint'))?.solution ? 'Hier ist die Lösung.' : '')
              }
            >
              {p.hints.length === 0 ? 'Tipp 1' : p.hints.length === 1 ? 'Tipp 2' : 'Lösung zeigen'}
            </button>
            <button className="link" disabled={busy} onClick={() => void daily('skip')}>
              Überspringen
            </button>
          </div>
          <p className="small">Mit Tipp gibt es nur halbe Punkte. Überspringen kostet nichts.</p>
        </>
      )}
      <p role="status">{msg}</p>
    </section>
  );
}
