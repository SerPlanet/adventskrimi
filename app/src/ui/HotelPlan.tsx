import { useState } from 'react';
import { useSession } from '../store';
import './plan.css';

type Map = NonNullable<ReturnType<typeof useSession>['view']>['map'];
type Door = Map['doors'][number];
type Room = Map['rooms'][number];

const PAD = 2;

/** A door sits on a vertical or horizontal wall; the gap is drawn on that wall. */
function DoorMark({ d, rooms }: { d: Door; rooms: Room[] }) {
  const vertical = rooms.some(
    (r) =>
      (Math.abs(r.plan.x - d.at.x) < 1e-6 || Math.abs(r.plan.x + r.plan.w - d.at.x) < 1e-6) &&
      d.at.y >= r.plan.y &&
      d.at.y <= r.plan.y + r.plan.h,
  );
  const w = vertical ? 0.5 : 1.6;
  const h = vertical ? 1.6 : 0.5;
  return <rect className="door" x={d.at.x - w / 2} y={d.at.y - h / 2} width={w} height={h} />;
}

/**
 * Floor plan seen from above: rooms, doors, outside area, stairs at the rim. Doors are exactly
 * the edges of the room graph. Markers: you, people and "!" only in the room you are in.
 * `pick` mode = choose the room for tomorrow; otherwise a tap only shows a preview.
 */
export function HotelPlan(props: { pick?: string; onPick?: (id: string) => void }) {
  const { view } = useSession();
  const [peek, setPeek] = useState<string | null>(null);
  if (!view) return null;
  const { rooms, doors, outside, stairs } = view.map;
  const here = view.room?.id;
  const near = new Set(view.map.next_rooms);
  const everywhere = rooms.every((r) => r.id === here || near.has(r.id));

  const solid = outside.filter((o) => o.kind !== 'snow');
  const xs = [...rooms, ...solid].flatMap((r) => {
    const p = 'plan' in r ? r.plan : r;
    return [p.x, p.x + p.w];
  });
  const ys = [...rooms, ...solid].flatMap((r) => {
    const p = 'plan' in r ? r.plan : r;
    return [p.y, p.y + p.h];
  });
  const bx = Math.min(...xs) - PAD;
  const by = Math.min(...ys) - PAD;
  const bw = Math.max(...xs) + PAD - bx;
  const bh = Math.max(...ys) + PAD - by;
  const pct = (v: number, o: number, t: number) => `${((v - o) / t) * 100}%`;

  const stairOf = (id: string) => stairs.find((s) => s.room === id);
  const peeked = rooms.find((r) => r.id === peek);

  return (
    <div className="hotelplan">
      <div className="plan" style={{ aspectRatio: `${bw} / ${bh}` }}>
        <svg viewBox={`${bx} ${by} ${bw} ${bh}`} aria-hidden="true" focusable="false">
          <rect className="snow" x={bx} y={by} width={bw} height={bh} />
          {outside.map((o, i) =>
            o.kind === 'tree' ? (
              <g key={i} className="tree">
                <rect x={o.x + o.w / 2 - 0.15} y={o.y + o.h - 0.6} width="0.3" height="0.6" />
                <path
                  d={`M${o.x} ${o.y + o.h - 0.5}L${o.x + o.w / 2} ${o.y}L${o.x + o.w} ${o.y + o.h - 0.5}Z`}
                />
              </g>
            ) : o.kind === 'snow' ? null : (
              <rect key={i} className={o.kind} x={o.x} y={o.y} width={o.w} height={o.h} />
            ),
          )}
          {rooms.map((r) => (
            <g key={r.id} className={stairOf(r.id) ? 'stairs' : undefined}>
              <rect
                className="floor"
                x={r.plan.x}
                y={r.plan.y}
                width={r.plan.w}
                height={r.plan.h}
              />
              {stairOf(r.id) &&
                Array.from({ length: 6 }, (_, i) => (
                  <line
                    key={i}
                    x1={r.plan.x + 0.3}
                    x2={r.plan.x + r.plan.w - 0.3}
                    y1={r.plan.y + r.plan.h - 0.6 - i * ((r.plan.h - 1.2) / 5)}
                    y2={r.plan.y + r.plan.h - 0.6 - i * ((r.plan.h - 1.2) / 5)}
                  />
                ))}
            </g>
          ))}
          {rooms.map((r) => (
            <rect
              key={`w-${r.id}`}
              className="wall"
              x={r.plan.x}
              y={r.plan.y}
              width={r.plan.w}
              height={r.plan.h}
            />
          ))}
          {doors.map((d) => (
            <DoorMark key={`${d.a}-${d.b}`} d={d} rooms={rooms} />
          ))}
          {outside
            .filter((o) => o.label)
            .map((o, i) => (
              <text key={i} className="olabel" x={o.x + o.w / 2} y={o.y + o.h / 2 + 0.25}>
                {o.label}
              </text>
            ))}
        </svg>
        {rooms.map((r) => {
          const state = r.id === here ? 'here' : everywhere || near.has(r.id) ? 'near' : 'far';
          const picked = props.pick === r.id;
          const people = r.id === here ? (view.room?.npcs ?? []) : [];
          const flagged = r.id === here && view.room?.objects.some((o) => o.auffaellig);
          const st = stairOf(r.id);
          const label = `${r.name}${st ? (st.dir === 'down' ? ', Treppe nach unten' : ', Treppe nach oben') : ''}${state === 'here' ? ', hier bist du' : state === 'near' ? ', erreichbar' : ', nicht erreichbar'}`;
          const blocked = !!props.onPick && state === 'far';
          return (
            <button
              key={r.id}
              className={`rm ${state}${picked ? ' picked' : ''}`}
              style={{
                left: pct(r.plan.x, bx, bw),
                top: pct(r.plan.y, by, bh),
                width: `${(r.plan.w / bw) * 100}%`,
                height: `${(r.plan.h / bh) * 100}%`,
              }}
              disabled={blocked}
              aria-pressed={props.onPick ? picked : peek === r.id}
              aria-label={label}
              onClick={() =>
                props.onPick ? props.onPick(r.id) : setPeek(peek === r.id ? null : r.id)
              }
            >
              <span className="rn">{r.name}</span>
              {st && (
                <span className="sub" aria-hidden="true">
                  {st.dir === 'down' ? '⬇ Treppe' : '⬆ Treppe'}
                </span>
              )}
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
        })}
      </div>
      {everywhere && <p className="small">Du kannst überall hin.</p>}
      {peeked && !props.onPick && (
        <p className="card" role="status">
          <strong>{peeked.name}:</strong>{' '}
          {peeked.id === here
            ? 'Hier bist du gerade.'
            : everywhere || near.has(peeked.id)
              ? 'Du kannst morgen dorthin gehen. Wähle den Raum bei „Gute Nacht“.'
              : 'Von hier aus nicht in einem Schritt zu erreichen.'}
        </p>
      )}
    </div>
  );
}
