import { useSession } from '../../store';
import type { Find } from './shared';

/** "In die Akte legen" / "Aus der Akte nehmen" for one find (02c §7). */
export function FileFind({ f }: { f: Find }) {
  const { view, fileAdd, fileRemove, busy } = useSession();
  const filed = view?.filed.some((e) => e.kind === 'find' && e.ref === f.id) ?? false;
  return (
    <button
      className="filebtn"
      disabled={busy}
      aria-pressed={filed}
      onClick={() => void (filed ? fileRemove('find', f.id) : fileAdd({ kind: 'find', id: f.id }))}
    >
      {filed ? '✓ In der Akte (herausnehmen)' : '📎 In die Akte legen'}
    </button>
  );
}

/** Same for a newspaper article. */
export function FileArticle({ day, id }: { day: number; id: string }) {
  const { view, fileAdd, fileRemove, busy } = useSession();
  const filed = view?.filed.some((e) => e.kind === 'article' && e.ref === id) ?? false;
  return (
    <button
      className="filebtn"
      disabled={busy}
      aria-pressed={filed}
      onClick={() =>
        void (filed ? fileRemove('article', id) : fileAdd({ kind: 'article', day, id }))
      }
    >
      {filed ? '✓ In der Akte (herausnehmen)' : '📎 In die Akte legen'}
    </button>
  );
}
