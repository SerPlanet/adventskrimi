import { useState } from 'react';
import { useSession } from '../store';
import { HotelPlan } from '../ui/HotelPlan';

/**
 * End of day. On guided days (1-5) the corridor leads the way: the player only sees where they
 * will be, nothing to choose. In the free phase they pick tomorrow's room on the plan.
 */
export function EndDay({ close }: { close: () => void }) {
  const { view, endDay, busy } = useSession();
  const guided = view?.map.guided_next ?? false;
  const fixed = view?.map.next_rooms[0] ?? '';
  const [room, setRoom] = useState(view?.room?.id ?? '');
  const target = guided ? fixed : room;
  const name = view?.map.rooms.find((r) => r.id === target)?.name ?? '';
  return (
    <>
      <p>Danach kannst du diesen Tag nicht mehr ändern.</p>
      {guided ? (
        <p>
          Dein Weg führt dich morgen hierhin: <strong>{name}</strong>
        </p>
      ) : (
        <>
          <p>Wo willst du morgen sein?</p>
          <HotelPlan pick={room} onPick={setRoom} />
          <p role="status">
            Morgen: <strong>{name}</strong>
            {room === view?.room?.id ? ' (hier bleiben)' : ''}
          </p>
        </>
      )}
      <div className="row wrap">
        <button
          className="primary"
          disabled={busy || !target}
          onClick={async () => {
            if (await endDay(guided || target === view?.room?.id ? undefined : target)) close();
          }}
        >
          Ja, Tag beenden
        </button>
        <button onClick={close}>Noch nicht</button>
      </div>
    </>
  );
}
