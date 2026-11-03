import type { View } from '../../api';
import { FindCard } from '../../screens/FindCard';
import { Cards, LinkBox, type Find } from './shared';

const GENERAL = 'Allgemein (Zeitung, Hotelbuch)';

/** Index card per room: everything found there, with the day. */
export function Places(props: { view: View; finds: Find[] }) {
  const { view, finds } = props;
  const roomOf = (f: Find) => f.source.room ?? GENERAL;
  const names = [...new Set(finds.map(roomOf))].sort((a, b) =>
    a === GENERAL ? 1 : b === GENERAL ? -1 : a.localeCompare(b, 'de'),
  );
  const at = (name: string) => finds.filter((f) => roomOf(f) === name);

  return (
    <Cards
      label="Orte"
      items={names.map((n) => {
        const ids = new Set(at(n).map((f) => f.id));
        return {
          id: n,
          title: n,
          lines: [`${at(n).length} ${at(n).length === 1 ? 'Fund' : 'Funde'}`],
          link: view.links.some((l) => !l.done && (ids.has(l.a) || ids.has(l.b))),
        };
      })}
      empty="Noch nichts gefunden. Sieh dir im Hotel die Räume an."
      detail={(name) => (
        <article aria-label={`Ort ${name}`}>
          <h2>{name}</h2>
          {at(name).map((f) => (
            <FindCard key={f.id + f.source.day} f={f} />
          ))}
          <LinkBox links={view.links} ids={new Set(at(name).map((f) => f.id))} />
        </article>
      )}
    />
  );
}
