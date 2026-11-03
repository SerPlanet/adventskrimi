import type { View } from '../api';
import { Prop, propFor } from './props';
import './plan.css';

export interface Spot {
  key: string;
  kind: 'npc' | 'object';
  id: string;
  label: string;
  icon: string;
  /** can be tapped (people and things that are not decoration) */
  clickable: boolean;
  untersuchbar: boolean;
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

const HALF = 7.5; // half of the base width (15 %)
// a tappable thing is at least 48 px wide: about 16.5 % of a 360 px phone scene
const MIN_HALF = 8.25;
const half = (t: Spot) => Math.max(t.scale * HALF * (t.kind === 'npc' ? 2 / 3 : 1), MIN_HALF);

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
      icon: o.klasse === 'untersuchbar' ? '🔎' : '👁',
      clickable: o.klasse !== 'deko',
      untersuchbar: o.klasse === 'untersuchbar',
      prop: o.prop,
      open: o.explored,
      x: o.spot?.x ?? row(room.objects.length, i),
      y: hung ? 36 : base,
      scale: o.scale ?? (layer === 'back' ? 1 : 1 + (base - WALL) / 60),
      layer,
      hung,
    };
  });
  // people stand next to the furniture: in the gaps of the floor, smaller the farther away
  // blocked stretches: floor furniture (half its width each side), people already placed
  // (the middle of things further back must stay free as well)
  const blocked = things.map((t) => ({ x: t.x, half: !t.hung && t.y > 70 ? half(t) : 1 }));
  const people: Spot[] = room.npcs.map((n, i) => {
    let x = 50;
    let best = -99;
    for (let c = 8; c <= 92; c += 2) {
      const gap = Math.min(...blocked.map((b) => Math.abs(b.x - c) - b.half - MIN_HALF), 99);
      if (gap > best) {
        best = gap;
        x = c;
      }
    }
    blocked.push({ x, half: MIN_HALF });
    const y = 76 + (i % 2) * 9;
    return {
      key: `npc-${n.id}`,
      kind: 'npc',
      id: n.id,
      label: n.name,
      icon: '🧑',
      clickable: true,
      untersuchbar: false,
      open: false,
      x,
      y,
      scale: 0.55 + (y - 60) / 60,
      layer: 'front',
      hung: false,
    };
  });
  return place([...things, ...people]);
}

const box = (t: Spot) => {
  const w = 2 * half(t);
  const h = ((w * 100) / 62) * (t.kind === 'npc' ? 5 / 3 : 1); // the scene is 100 x 62; props are square, people 3 : 5
  const top = t.hung ? t.y - h / 2 : t.y - h;
  return { l: t.x - w / 2, r: t.x + w / 2, t: top, b: top + h, cy: top + h / 2 };
};
const covers = (a: Spot, b: Spot) => {
  const B = box(b);
  const A = box(a);
  return a.x > B.l && a.x < B.r && A.cy > B.t && A.cy < B.b;
};

/**
 * Keeps every thing tappable: nobody's middle may lie under another thing. A thing that would be
 * covered moves sideways, and if that is not enough a little toward us, to the nearest free spot.
 * Things keep their order of importance (the case's list), people come last.
 */
function place(all: Spot[]): Spot[] {
  const done: Spot[] = [];
  for (const t of all) {
    const home = { x: t.x, y: t.y };
    const ys = t.hung ? [0, 10, -8] : t.kind === 'npc' ? [0, 6, 12, 18] : [0, 8, 16];
    let best: { x: number; y: number; cost: number } | null = null;
    for (const dy of ys)
      for (let dx = 0; dx <= 100; dx += 1.5)
        for (const sx of dx === 0 ? [1] : [1, -1]) {
          const c = {
            ...t,
            x: home.x + dx * sx,
            y: Math.min(94, Math.max(t.hung ? 20 : WALL + 1, home.y + dy)),
          };
          const m = half(c);
          if (c.x < m || c.x > 100 - m) continue;
          if (done.some((d) => covers(c, d) || covers(d, c))) continue;
          const cost = dx + Math.abs(dy) * 1.5;
          if (!best || cost < best.cost) best = { x: c.x, y: c.y, cost };
        }
    if (best) {
      t.x = best.x;
      t.y = best.y;
    }
    done.push(t);
  }
  // far things first, so that near ones cover them
  return [...done].sort((a, b) => Number(a.hung) * -1 - Number(b.hung) * -1 || a.y - b.y);
}

const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

const COATS = ['#3f6b4f', '#8a3b34', '#35557a', '#6b4a86', '#a8782a', '#2f6b6b'];
const HAIRS = ['#2a1a10', '#8a5a2b', '#d9b45a', '#9a9a9a', '#5a2a18'];
const SKINS = ['#f1c9a0', '#e0b088', '#c58f66', '#8a5a3c'];
const pick = <T,>(xs: T[], n: number) => xs[n % xs.length] as T;

/** A small figure: coat, hair and face differ by name, so people can be told apart. */
function Person({ name }: { name: string }) {
  const h = hue(name);
  const hairStyle = h % 3;
  return (
    <svg viewBox="0 0 60 100" aria-hidden="true" focusable="false">
      <ellipse cx="30" cy="96" rx="20" ry="3" fill="#000" opacity="0.3" />
      <path d="M20 96V70H40V96Z" fill="#3a3a48" stroke="#3a2616" strokeWidth="2" />
      <path
        d="M12 76Q12 44 30 44Q48 44 48 76Z"
        fill={pick(COATS, h)}
        stroke="#3a2616"
        strokeWidth="2"
      />
      <circle cx="30" cy="30" r="13" fill={pick(SKINS, h >> 2)} stroke="#3a2616" strokeWidth="2" />
      {hairStyle === 0 && (
        <path
          d="M17 28Q18 14 30 14Q42 14 43 28Q36 20 30 21Q23 20 17 28Z"
          fill={pick(HAIRS, h >> 1)}
        />
      )}
      {hairStyle === 1 && (
        <path
          d="M16 34Q14 12 30 13Q46 12 44 34Q42 20 30 20Q18 20 16 34Z"
          fill={pick(HAIRS, h >> 1)}
        />
      )}
      {hairStyle === 2 && (
        <path
          d="M17 24Q30 8 43 24Z"
          fill={pick(HAIRS, h >> 1)}
          stroke="#3a2616"
          strokeWidth="1.5"
        />
      )}
      <circle cx="25" cy="31" r="1.4" fill="#2a1a10" />
      <circle cx="35" cy="31" r="1.4" fill="#2a1a10" />
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
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={i}
          cx={wx - 4.5 + ((i * 37 + h) % 9)}
          cy={6 + ((i * 53 + h) % 11)}
          r="0.5"
          fill="#fff"
        />
      ))}
      {[(wx + 40) % 100, (wx + 70) % 100].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="14" r="5" fill="#ffd98a" opacity="0.18" />
          <rect x={x - 0.8} y="11" width="1.6" height="4" fill="#5e3b1b" />
          <path d={`M${x - 1.2} 11Q${x} 7 ${x + 1.2} 11Z`} fill={i ? '#ffd24a' : '#ffb347'} />
        </g>
      ))}
      <rect
        x={((wx + 22) % 100) - 3}
        y="9"
        width="6"
        height="7"
        fill={`hsl(${h} 20% 55%)`}
        stroke="#5e3b1b"
        strokeWidth="0.8"
      />
      <g>
        <rect
          x={((wx + 55) % 100) - 1.8}
          y={floorY - 6}
          width="3.6"
          height="5"
          rx="0.6"
          fill="#8a5a2b"
          stroke="#3a2616"
          strokeWidth="0.4"
        />
        <path
          d={`M${(wx + 55) % 100} ${floorY - 6}q-3 -4 -1 -7M${(wx + 55) % 100} ${floorY - 6}q3 -4 1 -7M${(wx + 55) % 100} ${floorY - 6}v-8`}
          stroke="#3f6b4f"
          strokeWidth="1"
          fill="none"
        />
      </g>
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
      <ellipse
        cx={100 - wx}
        cy={H - 12}
        rx="20"
        ry="4.5"
        fill={`hsl(${(h + 150) % 360} 35% 32%)`}
        opacity="0.75"
      />
      <ellipse
        cx={100 - wx}
        cy={H - 12}
        rx="14"
        ry="2.8"
        fill="none"
        stroke="#f6ecd0"
        strokeWidth="0.3"
        opacity="0.5"
      />
      <path
        d={`M${wx - 6} 21L${wx - 14} ${H - 4}H${wx + 14}L${wx + 6} 21Z`}
        fill="#ffe9b0"
        opacity="0.1"
      />
      <rect y={H - 6} width={W} height="6" fill="#000" opacity="0.18" />
    </svg>
  );
}

/**
 * Scene of a room, composed by hand: things stand where the case puts them, at their size and
 * depth. Every hotspot is a real button; the list of things is an extra help below the scene.
 */
export function RoomScene(props: {
  room: Room;
  onSpot: (s: Spot) => void;
  armed: boolean;
  /** "Umsehen": everything tappable glints for a moment */
  glint: boolean;
}) {
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
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.scale * (s.kind === 'npc' ? 7 : 11)}%`,
            }}
          />
        ))}
      {spots.map((s) => {
        const style = {
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: `${s.scale * (s.kind === 'npc' ? 10 : 15)}%`,
        };
        const cls = `spot ${s.kind}${s.hung ? ' hung' : ''}${s.open ? ' open' : ''}`;
        const art =
          s.kind === 'npc' ? (
            <Person name={s.label} />
          ) : (
            <Prop name={s.label} prop={s.prop} open={s.open} />
          );
        // decoration is only a picture: not tappable, not announced
        if (!s.clickable)
          return (
            <span key={s.key} className={`${cls} deco`} style={style} aria-hidden="true">
              {art}
            </span>
          );
        return (
          <button
            key={s.key}
            className={`${cls} clickable${props.armed ? ' target' : ''}${props.glint ? ' glint' : ''}`}
            style={style}
            aria-label={s.label + (s.open ? ' (untersucht)' : '')}
            onClick={() => props.onSpot(s)}
          >
            {art}
            {s.kind === 'npc' && (
              <span className="tag" aria-hidden="true">
                {s.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
