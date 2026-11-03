import { useState } from 'react';
import { useSession } from '../store';

interface Lock {
  puzzle_id: string;
  prompt: string;
  solved: boolean;
  hints: string[];
}

/**
 * The puzzle of a lock (02c §5). It appears on the thing only after the player tried it; there is
 * no list of puzzles in the room. Wrong answers cost nothing, tips are free of charge.
 */
export function LockPanel({ lock, play }: { lock: Lock; play: boolean }) {
  const { objectPuzzle, busy } = useSession();
  const [answer, setAnswer] = useState('');
  const [msg, setMsg] = useState('');
  if (lock.solved)
    return (
      <p className="small" role="status">
        🔓 Das Schloss ist offen. Untersuche das Ding noch einmal genau.
      </p>
    );

  const check = async () => {
    const r = await objectPuzzle(lock.puzzle_id, 'check', answer);
    if (r)
      setMsg(
        r.correct ? 'Das Schloss springt auf.' : 'Das passt noch nicht. Versuch es noch einmal.',
      );
  };
  const tip = async () => {
    const r = await objectPuzzle(lock.puzzle_id, 'hint');
    if (r?.hint) setMsg(`Tipp: ${r.hint}`);
  };

  return (
    <section className="lock" aria-label="Schloss">
      <h3>🔒 Das Schloss</h3>
      <p>{lock.prompt}</p>
      {lock.hints.map((h) => (
        <p key={h} className="small">
          💡 {h}
        </p>
      ))}
      <label>
        Deine Antwort
        <input value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!play} />
      </label>
      <div className="row wrap">
        <button
          className="primary"
          disabled={!play || busy || !answer.trim()}
          onClick={() => void check()}
        >
          Ausprobieren
        </button>
        <button disabled={!play || busy} onClick={() => void tip()}>
          Tipp
        </button>
      </div>
      <p role="status">{msg}</p>
    </section>
  );
}
