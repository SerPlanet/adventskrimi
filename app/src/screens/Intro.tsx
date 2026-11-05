import { useEffect, useRef, useState } from 'react';
import { useSession } from '../store';

/** The narrative opening of a day (02c §2): a few sentences, then "Weiter". Re-readable in the day tab. */
export function Intro({ onDone }: { onDone: () => void }) {
  const { view } = useSession();
  const go = useRef<HTMLButtonElement>(null);
  const [card, setCard] = useState(0);
  useEffect(() => go.current?.focus(), []);
  if (!view) return null;
  const cards = view.narrative_cards;
  const last = card >= cards.length - 1;
  return (
    <section className="intro" aria-labelledby="intro-h">
      <h1 id="intro-h">Tag {view.day}</h1>
      {view.day === 1 && view.roles.length > 0 && (
        <p className="small">Deine Rolle: {view.role.name}</p>
      )}
      <p className="story" aria-live="polite">
        {cards[card]}
      </p>
      {cards.length > 1 && (
        <p className="small">
          Karte {card + 1} von {cards.length}
        </p>
      )}
      <button ref={go} className="primary" onClick={() => (last ? onDone() : setCard(card + 1))}>
        Weiter
      </button>
    </section>
  );
}
