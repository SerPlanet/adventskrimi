import { useMemo, useState } from 'react';
import { useSession } from '../store';
import { emptyFilter, filterFinds, options, type FindFilter } from '../filters';
import { FindCard } from './FindCard';

type Tab = 'funde' | 'gegenstaende' | 'hotelbuch';
const TABS: [Tab, string][] = [
  ['funde', 'Funde'],
  ['gegenstaende', 'Gegenstände'],
  ['hotelbuch', 'Hotelbuch'],
];

function Select(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: string[];
}) {
  return (
    <label>
      {props.label}
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        <option value="">Alle</option>
        {props.items.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
    </label>
  );
}

/** Akte: all finds with filters and search, inventory, and the hotel book (finds by day). */
export function Dossier() {
  const { view } = useSession();
  const [tab, setTab] = useState<Tab>('funde');
  const [flt, setFlt] = useState<FindFilter>(emptyFilter);
  const finds = useMemo(() => view?.finds ?? [], [view?.finds]);
  const opt = useMemo(() => options(finds), [finds]);
  const shown = useMemo(() => filterFinds(finds, flt), [finds, flt]);
  const set = <K extends keyof FindFilter>(k: K, v: FindFilter[K]) => setFlt({ ...flt, [k]: v });
  const days = [...new Set(finds.map((f) => f.source.day))].sort((a, b) => a - b);

  return (
    <>
      <h1>Deine Akte</h1>
      <div className="tabs" role="tablist" aria-label="Bereiche der Akte">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'on' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'funde' && (
        <section role="tabpanel" aria-label="Funde">
          <div className="filters">
            <label>
              Suche
              <input type="search" value={flt.q} onChange={(e) => set('q', e.target.value)} />
            </label>
            <label>
              Art
              <select
                value={flt.type}
                onChange={(e) => set('type', e.target.value as FindFilter['type'])}
              >
                <option value="all">Alle</option>
                <option value="fact">Fakten</option>
                <option value="statement">Aussagen</option>
              </select>
            </label>
            <Select
              label="Person"
              value={flt.person}
              onChange={(v) => set('person', v)}
              items={opt.persons}
            />
            <Select
              label="Raum"
              value={flt.room}
              onChange={(v) => set('room', v)}
              items={opt.rooms}
            />
            <Select label="Tag" value={flt.day} onChange={(v) => set('day', v)} items={opt.days} />
          </div>
          <p role="status">
            {shown.length} von {finds.filter((f) => f.type !== 'item').length} Funden
          </p>
          {shown.map((f) => (
            <FindCard key={f.id + f.source.day} f={f} />
          ))}
          {finds.length === 0 && (
            <p>Noch nichts gefunden. Geh ins Hotel und sprich mit den Leuten.</p>
          )}
        </section>
      )}

      {tab === 'gegenstaende' && (
        <section role="tabpanel" aria-label="Gegenstände">
          {view?.inventory.length ? (
            view.inventory.map((i) => (
              <article className="find item" key={i.id}>
                <h2>🎒 {i.name}</h2>
                <p>{i.text}</p>
              </article>
            ))
          ) : (
            <p>Du trägst noch keine Gegenstände bei dir.</p>
          )}
        </section>
      )}

      {tab === 'hotelbuch' && (
        <section role="tabpanel" aria-label="Hotelbuch">
          {days.map((d) => (
            <div key={d}>
              <h2>Tag {d}</h2>
              {finds
                .filter((f) => f.source.day === d)
                .map((f) => (
                  <FindCard key={f.id} f={f} />
                ))}
            </div>
          ))}
          {finds.length === 0 && <p>Das Hotelbuch ist noch leer.</p>}
        </section>
      )}
    </>
  );
}
