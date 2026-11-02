import type { View } from '../api';
import { Prop } from './props';

export interface Spot {
  key: string;
  kind: 'npc' | 'object';
  id: string;
  label: string;
  icon: string;
  bang: boolean;
  /** explicit prop of the case, else chosen from the name */
  prop?: string;
  /** the thing has been examined: shown in its open state */
  open: boolean;
  x: number;
  y: number;
}

type Room = NonNullable<View['room']>;

/** Hotspots of the room: given positions where the case has them, an even row otherwise. */
export function spotsOf(room: Room): Spot[] {
  const row = (n: number, i: number) => ((i + 1) * 100) / (n + 1);
  return [
    ...room.npcs.map((n, i) => ({
      key: `npc-${n.id}`,
      kind: 'npc' as const,
      id: n.id,
      label: n.name,
      icon: '🧑',
      bang: false,
      open: false,
      x: row(room.npcs.length, i),
      y: 78,
    })),
    ...room.objects.map((o, i) => ({
      key: `obj-${o.id}`,
      kind: 'object' as const,
      id: o.id,
      label: o.name,
      icon: o.auffaellig ? '❗' : '🔹',
      bang: o.auffaellig,
      prop: o.prop,
      open: o.explored,
      x: o.spot?.x ?? row(room.objects.length, i),
      // case spots use two rows near the top; spread them over the taller scene
      y: Math.min(70, 18 + ((o.spot?.y ?? 30) - 20) * 1.7),
    })),
  ];
}

const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

function Person({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path
        d="M26 94 Q26 56 50 56 Q74 56 74 94Z"
        fill="#3f6b4f"
        stroke="#3a2616"
        strokeWidth="2.5"
      />
      <circle cx="50" cy="34" r="17" fill="#f1c9a0" stroke="#3a2616" strokeWidth="2.5" />
      <text x="50" y="82" textAnchor="middle" fontSize="22" fill="#f6ecd0">
        {name.slice(0, 1)}
      </text>
    </svg>
  );
}

/**
 * Scene of a room: wall, floor, window with snow, props at their spots. Pictures from
 * app/public/scenes/<scene>.* can replace the drawing later (style guide: ui/style-guide.md).
 * Every hotspot is a real button; the same actions are in the list below the scene.
 */
export function RoomScene(props: { room: Room; onSpot: (s: Spot) => void; armed: boolean }) {
  const h = hue(props.room.scene);
  return (
    <div className="scene" role="group" aria-label={`Szene: ${props.room.name}`}>
      <svg viewBox="0 0 100 72" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <rect width="100" height="46" fill={`hsl(${h} 30% 44%)`} />
        <rect y="46" width="100" height="26" fill={`hsl(${h} 26% 30%)`} />
        <path d="M0 46H100" stroke="#3a2616" strokeWidth="1.2" />
        <path d="M25 0V46M50 0V46M75 0V46" stroke="#3a2616" strokeWidth="0.5" opacity="0.35" />
        <rect y="43" width="100" height="3" fill="#5e3b1b" opacity="0.6" />
      </svg>
      {spotsOf(props.room).map((s) => (
        <button
          key={s.key}
          className={`spot ${s.kind}${props.armed ? ' target' : ''}${s.open ? ' open' : ''}`}
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
          aria-label={s.label + (s.bang ? ' (auffällig)' : '') + (s.open ? ' (untersucht)' : '')}
          onClick={() => props.onSpot(s)}
        >
          {s.kind === 'npc' ? (
            <Person name={s.label} />
          ) : (
            <Prop name={s.label} prop={s.prop} open={s.open} />
          )}
          {s.bang && !s.open && (
            <span className="bang" aria-hidden="true">
              !
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
