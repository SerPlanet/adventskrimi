import type { View } from '../api';

type Source = View['finds'][number]['source'];

/** Shows a find the way its source wants it: speech bubbles, a note, or plain text. */
export function SourceCard({ s, text }: { s: Source; text: string }) {
  if (s.presentation === 'dialog' && s.lines?.length)
    return (
      <div className="bubbles">
        {s.lines.map((l, i) => (
          <p key={i} className={`bubble ${i % 2 ? 'r' : 'l'}`}>
            <strong>{l.speaker}:</strong> {l.text}
          </p>
        ))}
      </div>
    );
  if (s.presentation === 'note' && s.note)
    return (
      <div className="zettel">
        <p className="small">
          Von {s.note.from} an {s.note.to}
        </p>
        <p>{s.note.text}</p>
      </div>
    );
  return <p>{text}</p>;
}
