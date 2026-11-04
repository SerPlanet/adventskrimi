import { useEffect, useRef } from 'react';
import { useSession } from '../store';

/** The narrative opening of a day (02c §2): a few sentences, then "Weiter". Re-readable in the day tab. */
export function Intro({ onDone }: { onDone: () => void }) {
  const { view } = useSession();
  const go = useRef<HTMLButtonElement>(null);
  useEffect(() => go.current?.focus(), []);
  if (!view) return null;
  return (
    <section className="intro" aria-labelledby="intro-h">
      <h1 id="intro-h">Tag {view.day}</h1>
      {view.day === 1 && view.roles.length > 0 && (
        <p className="small">Deine Rolle: {view.role.name}</p>
      )}
      <p className="story">{view.narrative}</p>
      <button ref={go} className="primary" onClick={onDone}>
        Weiter
      </button>
    </section>
  );
}
