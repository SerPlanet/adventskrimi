import { useEffect, useRef, useState } from 'react';
import { useSession } from '../store';

/** "Wer bist du?" (D78): the role only changes the address and the telling, never the play. */
export function RoleCard() {
  const { view, saveSettings, busy } = useSession();
  const head = useRef<HTMLHeadingElement>(null);
  const [pick, setPick] = useState(view?.roles[0]?.id ?? '');
  useEffect(() => head.current?.focus(), []);
  if (!view) return null;
  return (
    <section className="intro" aria-labelledby="role-h">
      <h1 id="role-h" ref={head} tabIndex={-1}>
        Wer bist du?
      </h1>
      <p>Die Rolle ändert nur, wie man dich anspricht. Im Spiel hat sie keinen Vorteil.</p>
      <fieldset>
        <legend>Rolle wählen</legend>
        {view.roles.map((r) => (
          <label key={r.id} className="radio">
            <input
              type="radio"
              name="role"
              checked={pick === r.id}
              onChange={() => setPick(r.id)}
            />{' '}
            {r.name}
          </label>
        ))}
      </fieldset>
      <button
        className="primary"
        disabled={busy || !pick}
        onClick={() => void saveSettings({ role: pick })}
      >
        Weiter
      </button>
    </section>
  );
}
