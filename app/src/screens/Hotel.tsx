import { useState } from 'react';
import { useSession, type ActResult, type Action } from '../store';
import { FindCard } from './FindCard';
import { ObjectPuzzles } from './ObjectPuzzles';

/** Hotel: map, current room, free "Ansehen", actions, end of day. */
export function Hotel() {
  const { view, act, busy } = useSession();
  const [last, setLast] = useState<{ result: ActResult; plaque: string | null } | null>(null);
  const [ending, setEnding] = useState(false);
  if (!view) return null;

  const left = view.actions.budget - view.actions.used;
  const play = view.can_play && !view.finished;
  const room = view.room;

  const run = async (a: Action) => setLast(await act(a));
  const newFinds = view.finds.filter((f) => last?.result.new_items?.includes(f.id));

  if (view.finished)
    return (
      <section className="card">
        <h1>Der Fall ist abgeschlossen</h1>
        <p>Du hast alle 24 Tage gespielt. Sieh dir die Rangliste an.</p>
      </section>
    );

  return (
    <>
      {!play && (
        <p className="card" role="status">
          ⏳ Dein Tag {view.day} ist noch nicht freigeschaltet. Komm morgen wieder. Die Zeitung
          früherer Tage kannst du jederzeit lesen.
        </p>
      )}
      <section aria-labelledby="map-h">
        <h2 id="map-h">Karte</h2>
        <ul className="map">
          {view.map.rooms.map((r) => {
            const here = r.id === view.room?.id;
            const reachable = view.map.next_rooms.includes(r.id);
            return (
              <li key={r.id} className={here ? 'here' : reachable ? 'near' : 'far'}>
                {here ? '📍 ' : reachable ? '➡️ ' : ''}
                {r.name}
                <small>{here ? ' (du bist hier)' : reachable ? ' (morgen erreichbar)' : ''}</small>
              </li>
            );
          })}
        </ul>
      </section>

      {room && (
        <section aria-labelledby="room-h">
          <h1 id="room-h">{room.name}</h1>
          <p>{room.description}</p>
          {room.blocked && (
            <p className="card">
              ⛔ Dieser Raum ist heute gesperrt. Du kannst nur den Tag beenden.
            </p>
          )}

          {room.npcs.length > 0 && <h2>Personen</h2>}
          {room.npcs.map((n) => (
            <div className="card" key={n.id}>
              <h3>{n.name}</h3>
              <p className="small">{n.role}</p>
              <div className="row wrap">
                {n.topics.map((t) => (
                  <button
                    key={t.id}
                    disabled={!play || busy}
                    onClick={() => void run({ type: 'talk', npc: n.id, topic: t.id })}
                  >
                    Fragen: {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {room.objects.length > 0 && <h2>Dinge im Raum</h2>}
          {room.objects.map((o) => (
            <div className="card" key={o.id}>
              <h3>
                {o.name}{' '}
                {o.auffaellig && (
                  <span title="Auffällig">
                    ❗<span className="sr"> Auffällig</span>
                  </span>
                )}
              </h3>
              <p>{o.text}</p>
              <button
                disabled={!play || busy}
                onClick={() => void run({ type: 'inspect', object: o.id })}
              >
                Genau untersuchen
              </button>
            </div>
          ))}

          <ObjectPuzzles disabled={!play || busy} />

          {room.book && (
            <button disabled={!play || busy} onClick={() => void run({ type: 'hotelbook' })}>
              📖 Hotelbuch lesen
            </button>
          )}

          {view.inventory.length > 0 && <UseItem run={run} disabled={!play || busy} />}
        </section>
      )}

      {last && (
        <section className="card result" aria-live="polite" aria-label="Ergebnis">
          {last.result.status === 'found' ? (
            <>
              <h2>Neu in deiner Akte</h2>
              {newFinds.map((f) => (
                <FindCard key={f.id} f={f} />
              ))}
              {last.plaque && <p>🏅 Du bist die/der Erste! Plakette: „{last.plaque}“.</p>}
            </>
          ) : (
            <p>{last.result.message}</p>
          )}
        </section>
      )}

      <p className="small">
        Eine Aktion zählt nur, wenn sie etwas Neues bringt. Leere Versuche kosten nichts.
      </p>

      {!ending ? (
        <button className="primary" disabled={!play || busy} onClick={() => setEnding(true)}>
          Tag beenden
        </button>
      ) : (
        <EndDay left={left} close={() => setEnding(false)} />
      )}
    </>
  );
}

function UseItem({ run, disabled }: { run: (a: Action) => Promise<void>; disabled: boolean }) {
  const { view } = useSession();
  const [item, setItem] = useState(view?.inventory[0]?.id ?? '');
  const targets = [...(view?.room?.objects ?? []), ...(view?.room?.npcs ?? [])];
  const [target, setTarget] = useState('');
  return (
    <div className="card">
      <h2>Gegenstand benutzen</h2>
      <label>
        Gegenstand
        <select value={item} onChange={(e) => setItem(e.target.value)}>
          {view?.inventory.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Benutzen auf
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Bitte wählen</option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={disabled || !target}
        onClick={() => void run({ type: 'use', item, target })}
      >
        Benutzen
      </button>
    </div>
  );
}

function EndDay({ left, close }: { left: number; close: () => void }) {
  const { view, endDay, busy } = useSession();
  const options = view?.map.next_rooms ?? [];
  const [room, setRoom] = useState(view?.room?.id ?? '');
  const name = (id: string) => view?.map.rooms.find((r) => r.id === id)?.name ?? id;
  return (
    <section className="card" aria-labelledby="end-h">
      <h2 id="end-h">Tag beenden?</h2>
      <p>
        Danach kannst du diesen Tag nicht mehr ändern.
        {left > 0 &&
          ` Du hast noch ${left} ${left === 1 ? 'Aktion' : 'Aktionen'} übrig. Sie verfallen nicht, aber sie gelten nur für heute.`}
      </p>
      <fieldset>
        <legend>Wo willst du morgen sein?</legend>
        {options.map((id) => (
          <label key={id} className="radio">
            <input type="radio" name="room" checked={room === id} onChange={() => setRoom(id)} />
            {name(id)}
            {id === view?.room?.id ? ' (hier bleiben)' : ''}
          </label>
        ))}
      </fieldset>
      <div className="row">
        <button
          className="primary"
          disabled={busy || !room}
          onClick={async () => {
            if (await endDay(room === view?.room?.id ? undefined : room)) close();
          }}
        >
          Ja, Tag beenden
        </button>
        <button onClick={close}>Noch nicht</button>
      </div>
    </section>
  );
}
