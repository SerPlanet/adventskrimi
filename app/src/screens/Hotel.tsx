import { useState } from 'react';
import { useSession, type ActResult, type Action } from '../store';
import { ObjectPuzzles } from './ObjectPuzzles';
import { FindCard } from './FindCard';
import { EndDay } from './EndDay';
import { Popup } from '../ui/Popup';
import { HotelMap } from '../ui/HotelMap';
import { RoomScene, spotsOf, type Spot } from '../ui/RoomScene';
import { SourceCard } from '../ui/Bubbles';

type Open =
  | { kind: 'spot'; spot: Spot }
  | { kind: 'found'; result: ActResult; plaque: string | null }
  | { kind: 'night' };

/** Hotel: cross-section map, room scene with hotspots, popups for people and things. */
export function Hotel() {
  const { view, act, busy } = useSession();
  const [open, setOpen] = useState<Open | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  if (!view) return null;

  const play = view.can_play && !view.finished;
  const room = view.room;

  if (view.finished)
    return (
      <section className="card">
        <h1>Der Fall ist abgeschlossen</h1>
        <p>Du hast alle 24 Tage gespielt. Sieh dir Theorie und Rangliste an.</p>
      </section>
    );

  const run = async (a: Action) => {
    setMsg('');
    const r = await act(a);
    if (!r) return;
    if (r.result.status === 'found') setOpen({ kind: 'found', ...r });
    else {
      setMsg(r.result.message ?? '');
      setOpen(null);
    }
  };

  const onSpot = (s: Spot) => {
    setMsg('');
    if (armed) {
      void run({ type: 'use', item: armed, target: s.id });
      setArmed(null);
    } else setOpen({ kind: 'spot', spot: s });
  };

  const close = () => setOpen(null);
  const npc = open?.kind === 'spot' ? room?.npcs.find((n) => n.id === open.spot.id) : undefined;
  const obj = open?.kind === 'spot' ? room?.objects.find((o) => o.id === open.spot.id) : undefined;
  const newFinds =
    open?.kind === 'found' ? view.finds.filter((f) => open.result.new_items?.includes(f.id)) : [];
  const bySource = [...new Map(newFinds.map((f) => [f.source.id, f])).values()];

  return (
    <>
      {!play && (
        <p className="card" role="status">
          ⏳ Dein Tag {view.day} ist noch nicht freigeschaltet. Komm morgen wieder. Die Zeitung
          früherer Tage kannst du jederzeit lesen.
        </p>
      )}
      <h2>Das Hotel</h2>
      <HotelMap />

      {room && (
        <section aria-labelledby="room-h">
          <h1 id="room-h">{room.name}</h1>
          <p>{room.description}</p>
          <p className="row" role="status">
            <strong>
              Entdeckt {view.explore.found} von {view.explore.total}
            </strong>
            <span className="small">
              {view.explore.found >= view.explore.total
                ? 'Hier gibt es heute nichts Neues mehr.'
                : 'Sieh dir alles in Ruhe an. Es kostet nichts.'}
            </span>
          </p>
          {room.blocked && (
            <p className="card">
              ⛔ Dieser Raum ist heute gesperrt. Du kannst nur den Tag beenden.
            </p>
          )}
          {armed && (
            <p className="card" role="status">
              Gegenstand gewählt. Tippe jetzt Person oder Ding an.{' '}
              <button className="link" onClick={() => setArmed(null)}>
                Abbrechen
              </button>
            </p>
          )}
          {!room.blocked && <RoomScene room={room} onSpot={onSpot} armed={!!armed} />}

          <h2>Was gibt es hier?</h2>
          <ul className="plain">
            {spotsOf(room).map((s) => (
              <li key={s.key}>
                <button disabled={!play || busy} onClick={() => onSpot(s)}>
                  <span aria-hidden="true">{s.icon}</span> {s.label}
                  {s.bang && <span className="sr"> (auffällig)</span>}
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
          <p role="status">{msg}</p>

          <ObjectPuzzles disabled={!play || busy} />

          {view.inventory.length > 0 && (
            <div className="inv" role="group" aria-label="Deine Gegenstände">
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

      <button
        className="primary"
        disabled={!play || busy}
        onClick={() => setOpen({ kind: 'night' })}
      >
        🌙 Gute Nacht (Tag beenden)
      </button>

      {open?.kind === 'spot' && npc && (
        <Popup title={npc.name} onClose={close}>
          <p className="small">{npc.role}</p>
          <p>Worüber willst du sprechen?</p>
          <div className="row wrap">
            {npc.topics.map((t) => (
              <button
                key={t.id}
                className="chip"
                disabled={!play || busy}
                onClick={() => void run({ type: 'talk', npc: npc.id, topic: t.id })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Popup>
      )}
      {open?.kind === 'spot' && obj && (
        <Popup title={obj.name} onClose={close}>
          <p>{obj.text}</p>
          <button
            disabled={!play || busy}
            onClick={() => void run({ type: 'inspect', object: obj.id })}
          >
            🔎 Genau untersuchen
          </button>
          <p className="small">Nur Ansehen kostet nichts.</p>
        </Popup>
      )}
      {open?.kind === 'found' && (
        <Popup title="Neu in deiner Akte" onClose={close}>
          {bySource.map((f) => (
            <div key={f.source.id}>
              <SourceCard s={f.source} text={f.text} />
            </div>
          ))}
          {bySource.length === 0 && newFinds.map((f) => <FindCard key={f.id} f={f} />)}
          {open.plaque && <p>🏅 Du bist die/der Erste! Plakette: „{open.plaque}“.</p>}
          <p className="small">Alles liegt jetzt in deiner Akte.</p>
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
