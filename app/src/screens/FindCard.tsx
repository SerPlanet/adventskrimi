import type { ReactNode } from 'react';
import type { View } from '../api';
import { SourceCard } from '../ui/Bubbles';

export type Find = View['finds'][number];

/** One find: a fact (magnifier, always true) or a statement (speech bubble, may be false). */
export function FindCard({ f, action }: { f: Find; action?: ReactNode }) {
  const kind =
    f.type === 'fact'
      ? { icon: '🔍', label: 'Fakt', note: 'Das stimmt.' }
      : f.type === 'statement'
        ? { icon: '💬', label: 'Aussage', note: 'Das kann falsch sein.' }
        : { icon: '🎒', label: 'Gegenstand', note: '' };
  const doc = f.source.document;
  const who = f.type === 'statement' ? `${f.npc ?? 'Jemand'}: ` : '';
  const src = [f.source.npc, f.source.room, f.source.day ? `Tag ${f.source.day}` : '']
    .filter(Boolean)
    .join(', ');
  if (doc)
    return (
      <details className={`find ${f.type}`}>
        <summary>
          <span aria-hidden="true">📄</span> <strong>{doc.title}</strong>{' '}
          <span className="small">({src})</span>
        </summary>
        <SourceCard s={f.source} text={f.text} />
        {action}
      </details>
    );
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
      {action}
    </article>
  );
}
