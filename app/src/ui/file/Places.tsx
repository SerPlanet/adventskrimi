import type { View } from '../../api';
import { FindCard } from '../../screens/FindCard';
import { FileArticle, FileFind } from './FileButton';
import { Cards, type Find } from './shared';

const GENERAL = 'Allgemein';
const PAPER = 'Zeitung';

/** Index card per place: what the player filed from there, filed articles under "Zeitung". */
export function Places(props: { view: View; finds: Find[] }) {
  const { view, finds } = props;
  const articles = view.filed.filter((e) => e.kind === 'article');
  const roomOf = (f: Find) => f.source.room ?? GENERAL;
  const last = (n: string) => n === GENERAL || n === PAPER;
  const names = [...new Set([...finds.map(roomOf), ...(articles.length ? [PAPER] : [])])].sort(
    (a, b) => (last(a) ? 1 : last(b) ? -1 : a.localeCompare(b, 'de')),
  );
  const at = (name: string) => finds.filter((f) => roomOf(f) === name);

  return (
    <Cards
      label="Orte"
      items={names.map((n) => ({
        id: n,
        title: n,
        lines: [
          n === PAPER
            ? `${articles.length} Artikel`
            : `${at(n).length} ${at(n).length === 1 ? 'Eintrag' : 'Einträge'}`,
        ],
      }))}
      empty="Noch nichts in der Akte. Lege Funde und Zeitungsartikel selbst ein."
      detail={(name) => (
        <article aria-label={`Ort ${name}`}>
          <h2>{name}</h2>
          {name === PAPER
            ? articles.map(
                (a) =>
                  a.kind === 'article' && (
                    <article className="find article" key={a.ref}>
                      <h3>{a.title}</h3>
                      <p className="small">Zeitung, Tag {a.day}</p>
                      <p>{a.text}</p>
                      <FileArticle day={a.day} id={a.ref} />
                    </article>
                  ),
              )
            : at(name).map((f) => (
                <FindCard key={f.id + f.source.day} f={f} action={<FileFind f={f} />} />
              ))}
        </article>
      )}
    />
  );
}
