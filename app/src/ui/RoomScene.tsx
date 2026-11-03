import type { View } from '../api';
import { Prop, propFor } from './props';
import './plan.css';

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
  /** position in the scene, percent of width and of height; y is the foot of a standing thing */
  x: number;
  y: number;
  /** size relative to the base prop width */
  scale: number;
  layer: 'back' | 'front';
  /** hangs on the wall (anchored at its centre) instead of standing on the floor */
  hung: boolean;
}

type Room = NonNullable<View['room']>;

const WALL = 58; // wall height, percent of the scene (the floor line)
const HUNG = new Set(['pinnwand', 'zettel', 'schluessel', 'alarm']);

/**
 * Hotspots of the room, composed: a case spot {x,y} places the thing (y < 35 = against the wall,
 * below that = on the floor, nearer to us the lower it is); `scale` and `layer` override the
 * defaults. Without a spot the things stand in an even row.
 */
export function spotsOf(room: Room): Spot[] {
  const row = (n: number, i: number) => ((i + 1) * 100) / (n + 1);
  const things: Spot[] = room.objects.map((o, i) => {
    const y0 = o.spot?.y ?? 30;
    const layer = o.layer ?? (y0 < 35 ? 'back' : 'front');
    const hung = HUNG.has(propFor(o.name, o.prop));
    const base = layer === 'back' ? WALL + 1 : Math.min(94, WALL + 8 + (y0 - 35) * 1.3);
    return {
      key: `obj-${o.id}`,
      kind: 'object',
      id: o.id,
      label: o.name,
      icon: o.auffaellig ? '❗' : '🔹',
      bang: o.auffaellig,
      prop: o.prop,
      open: o.explored,
      x: o.spot?.x ?? row(room.objects.length, i),
      y: hung ? 36 : base,
      scale: o.scale ?? (layer === 'back' ? 1 : 1 + (base - WALL) / 60),
      layer,
      hung,
    };
  });
  const people: Spot[] = room.npcs.map((n, i) => ({
    key: `npc-${n.id}`,
    kind: 'npc',
    id: n.id,
    label: n.name,
    icon: '🧑',
    bang: false,
    open: false,
    x: row(room.npcs.length, i),
    y: 94,
    scale: 1.5,
    layer: 'front',
    hung: false,
  }));
  // far things first, so that near ones cover them
  return [...things, ...people].sort(
    (a, b) => Number(a.hung) * -1 - Number(b.hung) * -1 || a.y - b.y,
  );
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

/** Painted room: wall with panelling, window with snow and light, floor in perspective. */
function Backdrop({ scene, avoid }: { scene: string; avoid: number[] }) {
  const h = hue(scene);
  const W = 100;
  const H = 62;
  const floorY = (WALL / 100) * H;
  // window where the wall is free: the position farthest from standing/hanging things
  const wx = [14, 30, 50, 70, 86].reduce((best, c) =>
    Math.min(...avoid.map((a) => Math.abs(a - c)), 99) >
    Math.min(...avoid.map((a) => Math.abs(a - best)), 99)
      ? c
      : best,
  );
  const lines = Array.from({ length: 13 }, (_, i) => -30 + i * 13.3);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`glow-${scene}`} cx={wx / 100} cy="0.55" r="0.5">
          <stop offset="0" stopColor="#ffe9b0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe9b0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`shade-${scene}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={W} height={floorY} fill={`hsl(${h} 28% 36%)`} />
      {[10, 25, 40, 55, 70, 85].map((x) => (
        <rect key={x} x={x} width="7" height={floorY} fill="#000" opacity="0.07" />
      ))}
      <rect y={floorY - 9} width={W} height="9" fill={`hsl(${h} 24% 28%)`} />
      <rect y={floorY - 9} width={W} height="0.6" fill="#f6ecd0" opacity="0.35" />
      <rect y={floorY - 1.6} width={W} height="1.6" fill="#3a2616" />
      <rect y={0} width={W} height={floorY} fill={`url(#shade-${scene})`} />
      <rect
        x={wx - 7}
        y="5"
        width="14"
        height="22"
        fill="#cfe3f3"
        stroke="#3a2616"
        strokeWidth="1.2"
      />
      <path d={`M${wx - 6} 21 Q${wx - 2} 17 ${wx + 2} 19 T${wx + 6} 18V21Z`} fill="#eef4f8" />
      <path d={`M${wx} 4V21M${wx - 6} 12H${wx + 6}`} stroke="#3a2616" strokeWidth="1" />
      <rect x={wx - 7} y="20.5" width="14" height="1.6" fill="#5e3b1b" />
      <rect y={floorY} width={W} height={H - floorY} fill={`hsl(${h} 22% 24%)`} />
      <g stroke="#000" strokeWidth="0.25" opacity="0.35">
        {lines.map((x) => (
          <path key={x} d={`M50 ${floorY}L${x} ${H}`} />
        ))}
        {[0.2, 0.45, 0.75].map((t) => (
          <path key={t} d={`M0 ${floorY + (H - floorY) * t}H${W}`} />
        ))}
      </g>
      <rect y={floorY} width={W} height={H - floorY} fill={`url(#glow-${scene})`} />
      <rect y={H - 6} width={W} height="6" fill="#000" opacity="0.18" />
    </svg>
  );
}

/**
 * Scene of a room, composed by hand: things stand where the case puts them, at their size and
 * depth. Every hotspot is a real button; the list of things is an extra help below the scene.
 */
export function RoomScene(props: { room: Room; onSpot: (s: Spot) => void; armed: boolean }) {
  const spots = spotsOf(props.room);
  return (
    <div className="scene" role="group" aria-label={`Szene: ${props.room.name}`}>
      <Backdrop
        scene={props.room.scene}
        avoid={spots.filter((s) => s.layer === 'back' || s.hung).map((s) => s.x)}
      />
      {spots
        .filter((s) => !s.hung)
        .map((s) => (
          <span
            key={`sh-${s.key}`}
            className="shadow"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.scale * 11}%` }}
          />
        ))}
      {spots.map((s) => (
        <button
          key={s.key}
          className={`spot ${s.kind}${props.armed ? ' target' : ''}${s.open ? ' open' : ''}${s.hung ? ' hung' : ''}`}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.scale * 15}%` }}
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
