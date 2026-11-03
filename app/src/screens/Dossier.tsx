import { useMemo, useState } from 'react';
import { useSession } from '../store';
import { emptyFilter, filterFinds, options, type FindFilter } from '../filters';
import { Grid } from './Grid';
import { Timeline } from './Timeline';
import { Popup } from '../ui/Popup';
import { SourceCard } from '../ui/Bubbles';
import { People } from '../ui/file/People';
import { Places } from '../ui/file/Places';
import { Docs } from '../ui/file/Docs';
import '../ui/file/file.css';

type Tab = 'personen' | 'dokumente' | 'orte' | 'zeit' | 'raster';
const TABS: [Tab, string][] = [
  ['personen', 'Personen'],
  ['dokumente', 'Dokumente'],
  ['orte', 'Orte'],
  ['zeit', 'Zeit'],
  ['raster', 'Raster'],
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

/**
 * Akte: a folder with tabs (people, documents, places, time) and index cards. Search and filters
 * apply to all finds. Nothing moves into grid or timeline by itself (invariant 13).
 */
export function Dossier() {
  const { view, pocket, busy } = useSession();
  const [tab, setTab] = useState<Tab>('personen');
  const [flt, setFlt] = useState<FindFilter>(emptyFilter);
  const [reading, setReading] = useState<string | null>(null);
  const all = useMemo(() => view?.finds ?? [], [view?.finds]);
  const opt = useMemo(() => options(all), [all]);
  const finds = useMemo(() => filterFinds(all, flt), [all, flt]);
  const set = <K extends keyof FindFilter>(k: K, v: FindFilter[K]) => setFlt({ ...flt, [k]: v });
  if (!view) return null;

  const doc = all.find((f) => f.source.id === reading && f.source.document);
  const pocketed = view.documents.some((d) => d.id === reading);
  const filtered = tab === 'personen' || tab === 'dokumente' || tab === 'orte';

  return (
    <div className="folder">
      <h1>
        Deine Akte <span className="stampmark">Vertraulich</span>
      </h1>
      <div className="ftabs" role="tablist" aria-label="Reiter der Akte">
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

      <div className="sheetfile" role="tabpanel" aria-label={TABS.find((t) => t[0] === tab)?.[1]}>
        {filtered && (
          <>
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
              <Select
                label="Tag"
                value={flt.day}
                onChange={(v) => set('day', v)}
                items={opt.days}
              />
            </div>
            <p role="status" className="small">
              {finds.length} von {all.filter((f) => f.type !== 'item').length} Funden
            </p>
            {view.links.some((l) => !l.done) && (
              <p className="linkhint">
                🔗 Es warten Verknüpfungen auf dich. Du findest sie auf den Karten.
              </p>
            )}
          </>
        )}
        {tab === 'personen' && <People view={view} finds={finds} onDoc={(id) => setReading(id)} />}
        {tab === 'dokumente' && <Docs view={view} finds={finds} onOpen={(id) => setReading(id)} />}
        {tab === 'orte' && <Places view={view} finds={finds} />}
        {tab === 'zeit' && <Timeline />}
        {tab === 'raster' && <Grid />}
      </div>

      {doc && (
        <Popup title={doc.source.document?.title ?? 'Dokument'} onClose={() => setReading(null)}>
          <p className="small">
            {doc.source.room ? `Gefunden: ${doc.source.room}` : ''} (Tag {doc.source.day})
          </p>
          <SourceCard s={doc.source} text={doc.text} />
          {pocketed ? (
            <p className="small">📄 Eingesteckt: Du findest es auch im Hotel im Inventar.</p>
          ) : (
            <button disabled={busy} onClick={() => void pocket(doc.source.id)}>
              📄 Einstecken
            </button>
          )}
        </Popup>
      )}
    </div>
  );
}
