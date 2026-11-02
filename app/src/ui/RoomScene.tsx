import type { View } from '../api';

export interface Spot {
  key: string;
  kind: 'npc' | 'object';
  id: string;
  label: string;
  icon: string;
  bang: boolean;
  x: number;
  y: number;
}

/** Hotspots of the room: given positions where the case has them, an even row otherwise. */
export function spotsOf(room: NonNullable<View['room']>): Spot[] {
  const row = (n: number, i: number) => ((i + 1) * 100) / (n + 1);
  return [
    ...room.npcs.map((n, i) => ({
      key: `npc-${n.id}`,
      kind: 'npc' as const,
      id: n.id,
      label: n.name,
      icon: '🧑',
      bang: false,
      x: row(room.npcs.length, i),
      y: 62,
    })),
    ...room.objects.map((o, i) => ({
      key: `obj-${o.id}`,
      kind: 'object' as const,
      id: o.id,
      label: o.name,
      icon: o.auffaellig ? '❗' : '🔹',
      bang: o.auffaellig,
      x: o.spot?.x ?? row(room.objects.length, i),
      y: o.spot?.y ?? 30,
    })),
  ];
}

const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

/**
 * Scene of a room. Pictures from app/public/scenes/<scene>.* can replace the drawing later.
 * Every hotspot is a real button; the same actions are in the list below the scene.
 */
export function RoomScene(props: {
  room: NonNullable<View['room']>;
  onSpot: (s: Spot) => void;
  armed: boolean;
}) {
  const h = hue(props.room.scene);
  return (
    <div className="scene" role="group" aria-label={`Szene: ${props.room.name}`}>
      <svg viewBox="0 0 100 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <rect width="100" height="40" fill={`hsl(${h} 30% 42%)`} />
        <rect y="40" width="100" height="16" fill={`hsl(${h} 25% 28%)`} />
        <rect x="8" y="8" width="16" height="16" rx="1" fill="#cfe3f5" opacity="0.85" />
        <path d="M16 8v16M8 16h16" stroke="#6b4a2b" strokeWidth="1" />
        <circle cx="86" cy="14" r="4" fill="#ffd27a" opacity="0.8" />
      </svg>
      {spotsOf(props.room).map((s) => (
        <button
          key={s.key}
          className={`spot ${s.kind}${props.armed ? ' target' : ''}`}
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
          aria-label={s.label + (s.bang ? ' (auffällig)' : '')}
          onClick={() => props.onSpot(s)}
        >
          <span aria-hidden="true">{s.icon}</span>
        </button>
      ))}
    </div>
  );
}
