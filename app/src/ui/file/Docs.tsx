import type { View } from '../../api';
import type { Find } from './shared';

const KIND: Record<string, string> = {
  zettel: 'Zettel',
  brief: 'Brief',
  foto: 'Foto',
  quittung: 'Quittung',
};

/** The documents found so far: a stack of cards, open one to read it. Pocketed ones are marked. */
export function Docs(props: { view: View; finds: Find[]; onOpen: (sourceId: string) => void }) {
  const { view } = props;
  const docs = [
    ...new Map(props.finds.filter((f) => f.source.document).map((f) => [f.source.id, f])).values(),
  ];
  const pocketed = (id: string) => view.documents.some((d) => d.id === id);

  return (
    <>
      <h2>Dokumente</h2>
      {docs.length === 0 ? (
        <p>Noch kein Dokument gefunden. Manche Zettel und Briefe liegen in den Räumen.</p>
      ) : (
        <ul className="stack plain" aria-label="Dokumente">
          {docs.map((f) => (
            <li key={f.source.id}>
              <button className="docard" onClick={() => props.onOpen(f.source.id)}>
                <span className="clip" aria-hidden="true">
                  📎
                </span>
                <strong>{f.source.document?.title}</strong>
                <span className="small">
                  {KIND[f.source.document?.kind ?? ''] ?? 'Dokument'}
                  {f.source.room ? ` · ${f.source.room}` : ''} · Tag {f.source.day}
                </span>
                <span className="small">
                  {pocketed(f.source.id) ? '📄 Eingesteckt' : 'Nicht eingesteckt'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <h2>Gegenstände</h2>
      {view.inventory.length ? (
        view.inventory.map((i) => (
          <article className="find item" key={i.id}>
            <h3>🎒 {i.name}</h3>
            <p>{i.text}</p>
          </article>
        ))
      ) : (
        <p>Du trägst noch keine Gegenstände bei dir.</p>
      )}
    </>
  );
}
