import { useState } from 'react';
import { useSession } from '../store';
import { Popup } from '../ui/Popup';

/**
 * Zeitstrahl as a table (02c §8): time windows of the night across, rooms down. Tap a cell, pick
 * the people. Only what the player enters; nothing is checked, filled in or marked.
 */
export function Timeline() {
  const { view, setNote, busy } = useSession();
  const [open, setOpen] = useState<{ window: string; room: string } | null>(null);
  if (!view) return null;
  const windows = view.options.when;
  const rooms = view.map.rooms;
  const people = view.people;
  const table = view.notes.table;
  const names = (ids: string[]) => ids.map((id) => people.find((p) => p.id === id)?.name ?? id);
  const ids = open ? (table[`${open.window}|${open.room}`] ?? []) : [];
  const toggle = (id: string) => {
    if (!open) return;
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    void setNote({ kind: 'cell', window: open.window, room: open.room, persons: next });
  };

  return (
    <section role="tabpanel" aria-label="Zeit">
      <p className="small">
        Wer war wann wo? Tippe ein Feld und wähle die Personen. Du trägst alles selbst ein, das
        Spiel prüft nichts.
      </p>
      <div className="tablewrap">
        <table className="timetable">
          <caption className="sr">Zeitstrahl: Räume nach Zeitfenstern</caption>
          <thead>
            <tr>
              <th scope="col">Raum</th>
              {windows.map((w) => (
                <th key={w.id} scope="col">
                  {w.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.name}</th>
                {windows.map((w) => {
                  const who = names(table[`${w.id}|${r.id}`] ?? []);
                  return (
                    <td key={w.id}>
                      <button
                        className="cell"
                        aria-label={`${r.name}, ${w.name}: ${who.length ? who.join(', ') : 'leer'}`}
                        onClick={() => setOpen({ window: w.id, room: r.id })}
                      >
                        {who.length ? who.join(', ') : '＋'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Popup
          title={`${rooms.find((r) => r.id === open.room)?.name}, ${windows.find((w) => w.id === open.window)?.name}`}
          onClose={() => setOpen(null)}
        >
          <p>Wer war nach deinen Notizen hier?</p>
          <ul className="plain">
            {people.map((p) => (
              <li key={p.id}>
                <label className="radio">
                  <input
                    type="checkbox"
                    checked={ids.includes(p.id)}
                    disabled={busy}
                    onChange={() => toggle(p.id)}
                  />
                  {p.name}
                </label>
              </li>
            ))}
          </ul>
          <button className="primary" onClick={() => setOpen(null)}>
            Fertig
          </button>
        </Popup>
      )}
    </section>
  );
}
