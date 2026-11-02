import { useState } from 'react';
import { useSession } from '../store';
import { HotelMap } from '../ui/HotelMap';

/** End of day: pick tomorrow's room on the map. Nothing is lost by going to bed early. */
export function EndDay({ close }: { close: () => void }) {
  const { view, endDay, busy } = useSession();
  const [room, setRoom] = useState(view?.room?.id ?? '');
  const name = view?.map.rooms.find((r) => r.id === room)?.name ?? '';
  return (
    <>
      <p>Danach kannst du diesen Tag nicht mehr ändern.</p>
      <p>Wo willst du morgen sein?</p>
      <HotelMap pick={room} onPick={setRoom} />
      <p role="status">
        Morgen: <strong>{name}</strong>
        {room === view?.room?.id ? ' (hier bleiben)' : ''}
      </p>
      <div className="row wrap">
        <button
          className="primary"
          disabled={busy || !room}
          onClick={async () => {
            if (await endDay(room === view?.room?.id ? undefined : room)) close();
          }}
        >
          Ja, Tag beenden
        </button>
        <button onClick={close}>Noch nicht</button>
      </div>
    </>
  );
}
