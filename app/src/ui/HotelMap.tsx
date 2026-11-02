import { useState } from 'react';
import { useSession } from '../store';

/**
 * Cross-section of the hotel: floors top to bottom, rooms by column. Markers: "Du", reachable
 * (dashed), people and "!" only for the room you are in (no peeking). Rooms without floor/col
 * data fall back to a plain list. `pick` mode = choose the room for tomorrow.
 */
export function HotelMap(props: { pick?: string; onPick?: (id: string) => void }) {
  const { view } = useSession();
  const [peek, setPeek] = useState<string | null>(null);
  if (!view) return null;
  const here = view.room?.id;
  const rooms = view.map.rooms;
  const near = new Set(view.map.next_rooms);
  const placed = rooms.every((r) => r.floor !== undefined && r.col !== undefined);
  const floors = [...new Set(rooms.map((r) => r.floor ?? 0))].sort((a, b) => b - a);
  const cols = Math.max(1, ...rooms.map((r) => (r.col ?? 0) + 1));

  const cell = (r: (typeof rooms)[number]) => {
    const state = r.id === here ? 'here' : near.has(r.id) ? 'near' : 'far';
    const picked = props.pick === r.id;
    const people = r.id === here ? (view.room?.npcs ?? []) : [];
    const flagged = r.id === here && view.room?.objects.some((o) => o.auffaellig);
    const label = `${r.name}${state === 'here' ? ', hier bist du' : state === 'near' ? ', erreichbar' : ', nicht erreichbar'}`;
    const canClick = state !== 'far';
    return (
      <button
        key={r.id}
        className={`rm ${state}${picked ? ' picked' : ''}`}
        disabled={!canClick}
        aria-pressed={props.onPick ? picked : peek === r.id}
        aria-label={label}
        style={placed ? { gridColumn: (r.col ?? 0) + 1 } : undefined}
        onClick={() => (props.onPick ? props.onPick(r.id) : setPeek(peek === r.id ? null : r.id))}
      >
        <span className="rn">{r.name}</span>
        <span className="marks" aria-hidden="true">
          {state === 'here' && <b className="you">Du</b>}
          {people.map((n) => (
            <i key={n.id} className="who">
              {n.name.slice(0, 1)}
            </i>
          ))}
          {flagged && <b className="bang">!</b>}
        </span>
      </button>
    );
  };

  return (
    <div className="hotelmap">
      <div className="grid" style={{ ['--cols' as string]: cols }}>
        {placed
          ? floors.map((f) => (
              <div className="floor" key={f}>
                {rooms.filter((r) => r.floor === f).map(cell)}
              </div>
            ))
          : rooms.map(cell)}
      </div>
      {peek && !props.onPick && (
        <p className="card" role="status">
          {rooms.find((r) => r.id === peek)?.name}: Du kannst morgen dorthin gehen. Wähle den Raum
          beim „Tag beenden“.
        </p>
      )}
    </div>
  );
}
