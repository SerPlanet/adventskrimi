import type { View } from '../../api';
import { FindCard } from '../../screens/FindCard';
import { Cards, LinkBox, type Find } from './shared';

type Doc = View['documents'][number];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Index card per person: statements and facts from the talks, notes that name them. */
export function People(props: { view: View; finds: Find[]; onDoc: (sourceId: string) => void }) {
  const { view, finds } = props;
  const byPerson = (name: string) =>
    finds.filter((f) => f.source.npc === name || (f.type === 'statement' && f.npc === name));
  const docsOf = (name: string): Doc[] =>
    view.documents.filter((d) => d.note && (d.note.from === name || d.note.to === name));

  const persons = view.people.filter((p) => byPerson(p.name).length > 0);
  const items = persons.map((p) => {
    const mine = byPerson(p.name);
    const talks = new Set(mine.filter((f) => f.source.kind === 'talk').map((f) => f.source.id));
    const ids = new Set(mine.map((f) => f.id));
    return {
      id: p.id,
      title: p.name,
      photo: true,
      lines: [
        ...(p.role ? [p.role] : []),
        `${plural(talks.size, 'Gespräch', 'Gespräche')} · ${plural(docsOf(p.name).length, 'Dokument', 'Dokumente')}`,
      ],
      link: view.links.some((l) => !l.done && (ids.has(l.a) || ids.has(l.b))),
    };
  });

  return (
    <Cards
      label="Personen"
      items={items}
      empty="Noch keine Person kennengelernt. Sprich im Hotel mit den Leuten."
      detail={(id) => {
        const p = persons.find((x) => x.id === id);
        if (!p) return null;
        const mine = byPerson(p.name);
        return (
          <article aria-label={`Karteikarte ${p.name}`}>
            <h2>{p.name}</h2>
            {p.role && <p className="small">{p.role}</p>}
            {mine.map((f) => (
              <FindCard key={f.id + f.source.day} f={f} />
            ))}
            {docsOf(p.name).map((d) => (
              <p key={d.id}>
                <button className="link" onClick={() => props.onDoc(d.id)}>
                  📄 {d.title}
                </button>
              </p>
            ))}
            <LinkBox links={view.links} ids={new Set(mine.map((f) => f.id))} />
          </article>
        );
      }}
    />
  );
}
