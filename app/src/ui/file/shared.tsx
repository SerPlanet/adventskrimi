import { useEffect, useState, type ReactNode } from 'react';
import { useSession } from '../../store';
import type { View } from '../../api';
import './file.css';

export type Find = View['finds'][number];
export type FileLink = View['links'][number];

/** True from 900 px: list left, detail right. Below, the detail opens under its card. */
export function useWide(): boolean {
  const q = '(min-width: 900px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

/** Instant photo: a coloured initial on white paper (no real photos in the case). */
export function Polaroid({ name }: { name: string }) {
  return (
    <span className="polaroid" aria-hidden="true">
      <span style={{ background: `hsl(${hue(name)} 35% 42%)` }}>{name.slice(0, 1)}</span>
    </span>
  );
}

export interface CardItem {
  id: string;
  title: string;
  lines?: string[];
  photo?: boolean;
  /** a link waits on this card */
  link?: boolean;
}

/**
 * Index cards. Wide: the list on the left, the open card on the right. Narrow: the card opens
 * right under its entry. Only one of the two layouts is in the DOM.
 */
export function Cards(props: {
  items: CardItem[];
  detail: (id: string) => ReactNode;
  empty: string;
  label: string;
}) {
  const wide = useWide();
  const [sel, setSel] = useState<string | null>(null);
  const open = sel ?? (wide ? (props.items[0]?.id ?? null) : null);
  if (!props.items.length) return <p>{props.empty}</p>;

  const list = (
    <ul className="cards plain" aria-label={props.label}>
      {props.items.map((i) => (
        <li key={i.id}>
          <button
            className={`card-entry${open === i.id ? ' on' : ''}`}
            aria-expanded={open === i.id}
            onClick={() => setSel(open === i.id && !wide ? null : i.id)}
          >
            {i.photo && <Polaroid name={i.title} />}
            <span className="ct">
              <strong>{i.title}</strong>
              {i.lines?.map((l) => (
                <span key={l} className="small">
                  {l}
                </span>
              ))}
            </span>
            {i.link && (
              <span className="clip" title="Hier wartet eine Verknüpfung">
                🔗<span className="sr"> Verknüpfung</span>
              </span>
            )}
          </button>
          {!wide && open === i.id && <div className="detail">{props.detail(i.id)}</div>}
        </li>
      ))}
    </ul>
  );
  if (!wide) return list;
  return (
    <div className="cols2 wide-right masterdetail">
      {list}
      <div className="detail">{open ? props.detail(open) : null}</div>
    </div>
  );
}

/** "Das erinnert dich an …" on the card the two finds belong to. */
export function LinkBox({ links, ids }: { links: FileLink[]; ids: Set<string> }) {
  const { link, busy } = useSession();
  const mine = links.filter((l) => ids.has(l.a) || ids.has(l.b));
  if (!mine.length) return null;
  return (
    <div className="linkbox">
      <h3>Das erinnert dich an …</h3>
      {mine.map((l) => (
        <div key={l.id} className="row between">
          <span>{l.text}</span>
          {l.done ? (
            <span>✓ verknüpft</span>
          ) : (
            <button disabled={busy} onClick={() => void link(l.id)}>
              Verknüpfen (+3)
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
