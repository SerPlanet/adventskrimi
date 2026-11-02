import type { View } from '../api';

export type Find = View['finds'][number];

/** One find: a fact (magnifier, always true) or a statement (speech bubble, may be false). */
export function FindCard({ f }: { f: Find }) {
  const kind =
    f.type === 'fact'
      ? { icon: '🔍', label: 'Fakt', note: 'Das stimmt.' }
      : f.type === 'statement'
        ? { icon: '💬', label: 'Aussage', note: 'Das kann falsch sein.' }
        : { icon: '🎒', label: 'Gegenstand', note: '' };
  const who = f.type === 'statement' ? `${f.npc ?? 'Jemand'}: ` : '';
  const src = [f.source.npc, f.source.room, f.source.day ? `Tag ${f.source.day}` : '']
    .filter(Boolean)
    .join(', ');
  return (
    <article className={`find ${f.type}`}>
      <p className="kind">
        <span aria-hidden="true">{kind.icon}</span> <strong>{kind.label}</strong>{' '}
        <span className="small">{kind.note}</span>
      </p>
      <p>
        {who}
        {f.text}
      </p>
      {src && <p className="small">Quelle: {src}</p>}
    </article>
  );
}
