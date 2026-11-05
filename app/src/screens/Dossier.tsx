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
import { FindCard } from './FindCard';
import { FileFind } from '../ui/file/FileButton';
import '../ui/file/file.css';

type Tab = 'personen' | 'dokumente' | 'orte' | 'zeit' | 'raster' | 'verlauf';
const TABS: [Tab, string][] = [
  ['personen', 'Personen'],
  ['dokumente', 'Dokumente'],
  ['orte', 'Orte'],
  ['zeit', 'Zeit'],
  ['raster', 'Raster'],
  ['verlauf', 'Verlauf'],
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
  const [showFilters, setShowFilters] = useState(false);
  const all = useMemo(() => view?.finds ?? [], [view?.finds]);
  const filedIds = useMemo(
    () => new Set((view?.filed ?? []).filter((e) => e.kind === 'find').map((e) => e.ref)),
    [view?.filed],
  );
  const filedFinds = useMemo(() => all.filter((f) => filedIds.has(f.id)), [all, filedIds]);
  const opt = useMemo(() => options(filedFinds), [filedFinds]);
  const finds = useMemo(() => filterFinds(filedFinds, flt), [filedFinds, flt]);
  const set = <K extends keyof FindFilter>(k: K, v: FindFilter[K]) => setFlt({ ...flt, [k]: v });
  if (!view) return null;

  const doc = all.find((f) => f.source.id === reading && f.source.document);
  const pocketed = view.documents.some((d) => d.id === reading);
  const active = [
    flt.q.trim(),
    flt.type !== 'all' ? flt.type : '',
    flt.person,
    flt.room,
    flt.day,
  ].filter(Boolean).length;
  const filtered = tab === 'personen' || tab === 'dokumente' || tab === 'orte';

  return (
    <div className="folder">
      <h1>
        Deine Akte <span className="stampmark">Vertraulich</span>
      </h1>
      {view.mission && (
        <details className="mission">
          <summary>Dein Auftrag</summary>
          <p>{view.mission}</p>
        </details>
      )}
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
            <p className="row">
              <button
                aria-expanded={showFilters}
                aria-controls="dossier-filters"
                onClick={() => setShowFilters(!showFilters)}
              >
                🔍 Filter{active ? ` (${active} aktiv)` : ''} {showFilters ? '▴' : '▾'}
              </button>
              <span role="status" className="small">
                {finds.length} von {filedFinds.filter((f) => f.type !== 'item').length} Einträgen
              </span>
              {active > 0 && (
                <button className="link" onClick={() => setFlt(emptyFilter)}>
                  Zurücksetzen
                </button>
              )}
            </p>
            <div id="dossier-filters" hidden={!showFilters}>
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
            </div>
          </>
        )}
        {tab === 'personen' && <People view={view} finds={finds} onDoc={(id) => setReading(id)} />}
        {tab === 'dokumente' && <Docs view={view} finds={all} onOpen={(id) => setReading(id)} />}
        {tab === 'orte' && <Places view={view} finds={finds} />}
        {tab === 'zeit' && <Timeline />}
        {tab === 'raster' && <Grid />}
        {tab === 'verlauf' && (
          <>
            <h2>Verlauf</h2>
            <p className="small">
              Alles, was du erfahren hast, in der Reihenfolge deiner Tage. Lege selbst in die Akte,
              was dich interessiert.
            </p>
            {all
              .filter((f) => f.type !== 'item')
              .map((f) => (
                <FindCard key={f.id + f.source.day} f={f} action={<FileFind f={f} />} />
              ))}
            {all.length === 0 && (
              <p>Noch nichts erlebt. Geh in den Reiter Tag und sprich mit den Leuten.</p>
            )}
          </>
        )}
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
