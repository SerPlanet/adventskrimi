import type { View } from '../../api';
import { FindCard } from '../../screens/FindCard';
import { FileFind } from './FileButton';
import { Cards, type Find } from './shared';

type Doc = View['documents'][number];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Index card per speaker: what the player put into the dossier from the talks, notes that name them. */
export function People(props: { view: View; finds: Find[]; onDoc: (sourceId: string) => void }) {
  const { view, finds } = props;
  const byPerson = (name: string) =>
    finds.filter((f) => f.source.npc === name || (f.type === 'statement' && f.npc === name));
  const docsOf = (name: string): Doc[] =>
    view.documents.filter((d) => d.note && (d.note.from === name || d.note.to === name));

  const persons = view.people.filter((p) => byPerson(p.name).length > 0);
  const items = persons.map((p) => {
    const mine = byPerson(p.name);
    return {
      id: p.id,
      title: p.name,
      photo: true,
      lines: [
        ...(p.role ? [p.role] : []),
        `${plural(mine.length, 'Eintrag', 'Einträge')} · ${plural(docsOf(p.name).length, 'Dokument', 'Dokumente')}`,
      ],
    };
  });

  return (
    <Cards
      label="Personen"
      items={items}
      empty="Noch nichts von einer Person in der Akte. Lege Antworten aus Gesprächen selbst ein."
      detail={(id) => {
        const p = persons.find((x) => x.id === id);
        if (!p) return null;
        return (
          <article aria-label={`Karteikarte ${p.name}`}>
            <h2>{p.name}</h2>
            {p.role && <p className="small">{p.role}</p>}
            {byPerson(p.name).map((f) => (
              <FindCard key={f.id + f.source.day} f={f} action={<FileFind f={f} />} />
            ))}
            {docsOf(p.name).map((d) => (
              <p key={d.id}>
                <button className="link" onClick={() => props.onDoc(d.id)}>
                  📄 {d.title}
                </button>
              </p>
            ))}
          </article>
        );
      }}
    />
  );
}
