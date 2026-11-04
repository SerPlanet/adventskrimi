import { useEffect, useState } from 'react';
import { useSession, type ActResult, type Action } from '../store';
import { FindCard } from './FindCard';
import { FileFind } from '../ui/file/FileButton';
import { EndDay } from './EndDay';
import { GoodNight } from './GoodNight';
import { DayChip } from '../ui/DayChip';
import { Popup } from '../ui/Popup';
import { Dialog } from '../ui/Dialog';
import { LockPanel } from '../ui/LockPanel';
import { HotelPlan } from '../ui/HotelPlan';
import { RoomScene, spotsOf, type Spot } from '../ui/RoomScene';
import { SourceCard } from '../ui/Bubbles';
import { Prop } from '../ui/props';

type Open =
  | { kind: 'spot'; spot: Spot }
  | { kind: 'dialog'; npc: string }
  | { kind: 'found'; result: ActResult; plaque: string | null }
  | { kind: 'doc'; id: string }
  | { kind: 'night' };

/** The day: place, who is here, status, floor plan, room scene with hotspots, popups. */
export function Tag({ onNext }: { onNext: () => void }) {
  const { view, act, busy, pocket, ended } = useSession();
  const [open, setOpen] = useState<Open | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [glint, setGlint] = useState(false);
  // result of the last examination that brought nothing, and things already tried today
  const [note, setNote] = useState('');
  const [tried, setTried] = useState<string[]>([]);
  useEffect(() => {
    if (!glint) return;
    const t = setTimeout(() => setGlint(false), 2200);
    return () => clearTimeout(t);
  }, [glint]);
  if (!view) return null;

  const play = view.can_play && !view.finished;
  const left = Math.max(0, view.actions.budget - view.actions.used);
  const room = view.room;

  if (view.finished)
    return (
      <section className="card">
        <h1>Der Fall ist abgeschlossen</h1>
        <p>Du hast alle 24 Tage gespielt. Sieh dir Theorie und Rangliste an.</p>
      </section>
    );

  // the page stays after "Tag beenden"; a latecomer may go on to the next day
  if (view.day_over || ended !== null) return <GoodNight onNext={onNext} />;

  const run = async (a: Action) => {
    setMsg('');
    setNote('');
    const r = await act(a);
    if (!r) return;
    if (r.result.status === 'found') {
      setOpen({ kind: 'found', ...r });
      return;
    }
    if (a.type === 'inspect') {
      // stay in the close-up and say why nothing happened
      const st = r.result.status;
      if (st === 'empty' || st === 'known') {
        setTried((t) => [...t, `${view.day}:${a.object}`]);
        setNote('Hier gibt es heute nichts mehr zu finden. Das hat keine Aktion gekostet.');
      } else setNote(r.result.message ?? '');
      return;
    }
    setMsg(r.result.message ?? '');
    setOpen(null);
  };

  const onSpot = (s: Spot) => {
    setMsg('');
    setNote('');
    // a tap on a person starts the conversation at once; things open their close-up
    if (s.kind === 'npc') {
      setArmed(null);
      setOpen({ kind: 'dialog', npc: s.id });
    } else if (armed) {
      void run({ type: 'use', item: armed, target: s.id });
      setArmed(null);
    } else setOpen({ kind: 'spot', spot: s });
  };

  const close = () => setOpen(null);
  const obj = open?.kind === 'spot' ? room?.objects.find((o) => o.id === open.spot.id) : undefined;
  const newFinds =
    open?.kind === 'found' ? view.finds.filter((f) => open.result.new_items?.includes(f.id)) : [];
  const bySource = [...new Map(newFinds.map((f) => [f.source.id, f])).values()];

  return (
    <>
      {room && (
        <header className="dayhead">
          <h1 id="room-h">{room.name}</h1>
          <DayChip over={false} />
          <p>
            {room.npcs.length
              ? `Hier sind: ${room.npcs.map((n) => n.name).join(', ')}.`
              : 'Du bist allein hier.'}
          </p>
        </header>
      )}
      <div className="cols2 wide-left">
        <section aria-labelledby="plan-h">
          <h2 id="plan-h">Das Hotel</h2>
          <HotelPlan />
        </section>
        {room && (
          <aside aria-label="Ort und Erzählung">
            <p>{room.description}</p>
            <details className="narr">
              <summary>Erzählung noch einmal lesen</summary>
              <p>{view.narrative}</p>
            </details>
            {room.blocked && (
              <p className="card">
                ⛔ Dieser Raum ist heute gesperrt. Du kannst nur den Tag beenden.
              </p>
            )}
            <button
              className="primary"
              disabled={!play || busy}
              onClick={() => setOpen({ kind: 'night' })}
            >
              🌙 Gute Nacht (Tag beenden)
            </button>
          </aside>
        )}
      </div>

      {room && (
        <section className="roomwrap skin-room" aria-label={`Raum: ${room.name}`}>
          {armed && (
            <p className="card" role="status">
              Gegenstand gewählt. Tippe jetzt Person oder Ding an.{' '}
              <button className="link" onClick={() => setArmed(null)}>
                Abbrechen
              </button>
            </p>
          )}
          <div className="budget">
            <p className="row" role="status">
              <strong>
                Aktionen übrig ({left}/{view.actions.budget})
              </strong>
              {left === 0 && (
                <span className="small">
                  Für heute genug untersucht. Gespräche und Lesen sind weiter frei.
                </span>
              )}
            </p>
            <button onClick={() => setGlint(true)}>👀 Umsehen</button>
          </div>
          {!room.blocked && <RoomScene room={room} onSpot={onSpot} armed={!!armed} glint={glint} />}

          <details className="help">
            <summary>Liste der Dinge (Hilfe für Tastatur und Vorlesen)</summary>
            <ul className="plain">
              {spotsOf(room)
                .filter((s) => s.clickable)
                .map((s) => (
                  <li key={s.key}>
                    <button disabled={!play || busy} onClick={() => onSpot(s)}>
                      <span aria-hidden="true">{s.icon}</span> {s.label}
                    </button>
                  </li>
                ))}
              {room.book && (
                <li>
                  <button disabled={!play || busy} onClick={() => void run({ type: 'hotelbook' })}>
                    📖 Hotelbuch lesen
                  </button>
                </li>
              )}
            </ul>
          </details>
          <p role="status">{msg}</p>

          {(view.inventory.length > 0 || view.documents.length > 0) && (
            <div className="inv" role="group" aria-label="Dein Inventar">
              {view.documents.map((d) => (
                <button key={d.id} onClick={() => setOpen({ kind: 'doc', id: d.id })}>
                  📄 {d.title}
                </button>
              ))}
              {view.inventory.map((i) => (
                <button
                  key={i.id}
                  aria-pressed={armed === i.id}
                  title={i.text}
                  disabled={!play || busy}
                  onClick={() => setArmed(armed === i.id ? null : i.id)}
                >
                  🎒 {i.name}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {open?.kind === 'dialog' && <Dialog npcId={open.npc} play={play} onClose={close} />}
      {open?.kind === 'spot' && obj && (
        <Popup title={obj.name} onClose={close}>
          <Prop className="closeup" name={obj.name} prop={obj.prop} open={obj.explored} />
          <p className="small">
            {obj.explored
              ? 'Du hast es genau untersucht.'
              : 'Du siehst es dir an. Das kostet nichts.'}
          </p>
          <p>{obj.text}</p>
          {obj.lock && <LockPanel lock={obj.lock} play={play} />}
          {obj.klasse === 'ansehen' && (
            <p className="small">Hier gibt es etwas anzusehen, aber nichts zu untersuchen.</p>
          )}
          {obj.klasse === 'untersuchbar' && obj.explored && (
            <>
              <p>
                <strong>Schon untersucht.</strong> Das hast du gefunden:
              </p>
              {[
                ...new Map(
                  view.finds
                    .filter((f) => f.source.object === obj.id && f.source.kind === 'inspect')
                    .map((f) => [f.source.id, f]),
                ).values(),
              ].map((f) => (
                <SourceCard key={f.source.id} s={f.source} text={f.text} />
              ))}
            </>
          )}
          {obj.klasse === 'untersuchbar' && !obj.explored && (
            <>
              <button
                disabled={!play || busy || left === 0 || tried.includes(`${view.day}:${obj.id}`)}
                onClick={() => void run({ type: 'inspect', object: obj.id })}
              >
                🔎 Genauer untersuchen (kostet 1 Aktion)
              </button>
              <p className="small" role="status">
                {note ||
                  (tried.includes(`${view.day}:${obj.id}`)
                    ? 'Hier gibt es heute nichts mehr zu finden.'
                    : left === 0
                      ? 'Für heute genug untersucht (0 Aktionen übrig). Gespräche und Lesen sind weiter frei.'
                      : !play
                        ? 'Dieser Tag ist noch nicht freigeschaltet.'
                        : `Aktionen übrig (${left}/${view.actions.budget})`)}
              </p>
            </>
          )}
        </Popup>
      )}
      {open?.kind === 'found' && (
        <Popup title="Neu entdeckt" onClose={close}>
          {bySource.map((f) => (
            <div key={f.source.id}>
              <SourceCard s={f.source} text={f.text} />
              {newFinds
                .filter((x) => x.source.id === f.source.id && x.type !== 'item')
                .map((x) => (
                  <div key={x.id}>
                    <p className="small">
                      {x.type === 'statement' ? 'Aussage (kann falsch sein)' : 'Fakt (stimmt)'}:{' '}
                      {x.text}
                    </p>
                    <FileFind f={x} />
                  </div>
                ))}
              {f.source.document && !view.documents.some((d) => d.id === f.source.id) && (
                <button disabled={busy} onClick={() => void pocket(f.source.id)}>
                  📄 Einstecken
                </button>
              )}
              {f.source.document && view.documents.some((d) => d.id === f.source.id) && (
                <p className="small">📄 Eingesteckt: Du findest es im Inventar.</p>
              )}
            </div>
          ))}
          {bySource.length === 0 && newFinds.map((f) => <FindCard key={f.id} f={f} />)}
          {open.plaque && <p>🏅 Du bist die/der Erste! Plakette: „{open.plaque}“.</p>}
          <p className="small">
            Im Verlauf deiner Akte kannst du alles nachlesen. Lege selbst ein, was dich
            interessiert.
          </p>
        </Popup>
      )}
      {open?.kind === 'doc' && (
        <Popup
          title={view.documents.find((d) => d.id === open.id)?.title ?? 'Dokument'}
          onClose={close}
        >
          {view.documents
            .filter((d) => d.id === open.id)
            .map((d) => (
              <div key={d.id}>
                <p className="small">
                  {d.room ? `Gefunden: ${d.room}` : ''} {d.day ? `(Tag ${d.day})` : ''}
                </p>
                <SourceCard
                  s={{ ...d, kind: 'inspect', room: d.room, day: d.day ?? 0 } as never}
                  text={d.title}
                />
              </div>
            ))}
        </Popup>
      )}
      {open?.kind === 'night' && (
        <Popup title="Gute Nacht" onClose={close}>
          <EndDay close={close} />
        </Popup>
      )}
    </>
  );
}
