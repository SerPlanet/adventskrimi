import { useSession } from '../store';

/** Einstellungen. Changes are saved at once; "Spieler wechseln" goes back to the name tiles. */
export function Settings() {
  const { view, saveSettings, logout } = useSession();
  const s = view?.player.settings ?? {};
  const save = (patch: Record<string, unknown>) => void saveSettings(patch);

  return (
    <>
      <h1>Einstellungen</h1>
      <div className="card">
        <label>
          Schriftgröße
          <select
            value={s.font_size ?? 'normal'}
            onChange={(e) => save({ font_size: e.target.value })}
          >
            <option value="normal">Normal</option>
            <option value="large">Groß</option>
            <option value="xl">Sehr groß</option>
          </select>
        </label>
        <label>
          Dunkelmodus
          <select
            value={s.dark_mode ?? 'auto'}
            onChange={(e) => save({ dark_mode: e.target.value })}
          >
            <option value="auto">Wie auf dem Gerät</option>
            <option value="light">Hell</option>
            <option value="dark">Dunkel</option>
          </select>
        </label>
        <label className="radio">
          <input
            type="checkbox"
            checked={s.explanations !== false}
            onChange={(e) => save({ explanations: e.target.checked })}
          />
          Der Hotel-Page erklärt mir die ersten Tage
        </label>
      </div>
      <details className="card">
        <summary>So funktioniert’s</summary>
        <ol>
          <li>Jeden Tag bringt die Zeitung neue Meldungen. Lies sie zuerst.</li>
          <li>Im Hotel kannst du alles ansehen und mit allen Personen reden. Das ist gratis.</li>
          <li>„Genauer untersuchen“ kostet eine Aktion. Du hast nur wenige pro Tag.</li>
          <li>Was dir wichtig scheint, legst du selbst in die Akte.</li>
          <li>Zeit-Tabelle und Raster füllst du selbst aus. Das Spiel prüft nichts.</li>
          <li>Eine Aussage kann falsch sein. Ein Fakt stimmt immer.</li>
          <li>Mit „Gute Nacht“ beendest du den Tag. Verpasste Tage holst du nach.</li>
          <li>Ab Tag 20 kannst du die Täterin oder den Täter anklagen.</li>
        </ol>
      </details>
      <button onClick={logout}>Spieler wechseln</button>
    </>
  );
}
