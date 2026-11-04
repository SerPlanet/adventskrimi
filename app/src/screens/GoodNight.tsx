import { useEffect, useRef } from 'react';
import { useSession } from '../store';
import { DayChip } from '../ui/DayChip';

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The page after "Tag beenden" (02c §9): how the evening ends, what the day brought, the status,
 * and what comes next. A latecomer goes on to the next day, everybody else waits for midnight.
 */
export function GoodNight({ onNext }: { onNext: () => void }) {
  const { view, startNext } = useSession();
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => head.current?.focus(), []);
  if (!view) return null;
  const night = view.night;
  return (
    <section className="card dayover" aria-labelledby="over-h">
      <h1 id="over-h" ref={head} tabIndex={-1}>
        Gute Nacht
      </h1>
      <DayChip over />
      {night && (
        <>
          <p className="story">{night.text}</p>
          <p>
            Heute: {count(night.talks, 'Gespräch', 'Gespräche')},{' '}
            {count(night.finds, 'Fund', 'Funde')}.
          </p>
        </>
      )}
      {view.can_play ? (
        <>
          <p>
            Du bist dem Spiel noch ein Stück hinterher. Dein nächster Tag ist schon da
            {view.room ? ` (${view.room.name})` : ''}.
          </p>
          <button
            className="primary"
            onClick={() => {
              startNext();
              onNext();
            }}
          >
            Zum nächsten Tag
          </button>
        </>
      ) : (
        <p>
          Morgen ab 0 Uhr: <strong>{view.room?.name}</strong>. Dann liegt eine neue Zeitung bereit.
        </p>
      )}
    </section>
  );
}
