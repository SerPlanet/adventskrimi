import { useState } from 'react';
import { useSession } from '../store';
import { Popup } from '../ui/Popup';

/**
 * Zeitstrahl as a table (02c §8): time windows of the night across, rooms down. Tap a cell, pick
 * the people. Only what the player enters; nothing is checked, filled in or marked.
 */
export function Timeline() {
  const { view, setNote } = useSession();
  const [open, setOpen] = useState<{ window: string; room: string } | null>(null);
  if (!view) return null;
  const windows = view.options.when;
  const rooms = view.map.rooms;
  const people = view.people;
  const table = view.notes.table;
  const names = (ids: string[]) => ids.map((id) => people.find((p) => p.id === id)?.name ?? id);
  // Local copy while the dialog is open: the checkboxes stay enabled (and keep keyboard focus)
  // during the request, quick toggles never overwrite each other.
  const [draft, setDraft] = useState<string[]>([]);
  const ids = open ? draft : [];
  const openCell = (window: string, room: string) => {
    setDraft(table[`${window}|${room}`] ?? []);
    setOpen({ window, room });
  };
  const toggle = (id: string) => {
    if (!open) return;
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    setDraft(next);
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
                        onClick={() => openCell(w.id, r.id)}
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
