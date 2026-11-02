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
        <label>
          Notizen
          <select
            value={s.note_level ?? 'half'}
            onChange={(e) => save({ note_level: e.target.value })}
          >
            <option value="auto">Automatisch (das Spiel trägt ein)</option>
            <option value="half">Halb (das Spiel schlägt vor)</option>
            <option value="manual">Selbst (du trägst alles ein)</option>
          </select>
        </label>
        <label>
          Rätsel
          <select
            value={s.puzzle_level ?? 'medium'}
            onChange={(e) => save({ puzzle_level: e.target.value })}
          >
            <option value="easy">Leicht</option>
            <option value="medium">Mittel</option>
            <option value="hard">Schwer</option>
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
      <button onClick={logout}>Spieler wechseln</button>
    </>
  );
}
