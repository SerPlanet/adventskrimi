import { useState } from 'react';
import { useSession } from '../store';

/** Prolog companion "Page": one speech bubble per day, can be switched off for good. */
export function PageBubble() {
  const { view, saveSettings } = useSession();
  const [hidden, setHidden] = useState<number | null>(null);
  if (!view?.prolog || hidden === view.day) return null;
  return (
    <aside className="page" aria-label="Der Hotel-Page erklärt">
      <p>
        <span aria-hidden="true">🛎️</span> <strong>Page:</strong> {view.prolog.intro}
      </p>
      <p className="goal">Ziel heute: {view.prolog.goal}</p>
      {view.prolog.tips.length > 0 && (
        <ul>
          {view.prolog.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      <div className="row">
        <button onClick={() => setHidden(view.day)}>Verstanden</button>
        <button className="link" onClick={() => void saveSettings({ explanations: false })}>
          Page ausschalten
        </button>
      </div>
    </aside>
  );
}
