import type { Paper } from '../api';
import { FileArticle } from './file/FileButton';
import './paper.css';

/** Splits the story into a lead-in (first sentence) and the rest. */
function split(text: string): [string, string] {
  const m = /^(.+?[.!?])\s+(.*)$/s.exec(text);
  return m ? [m[1] as string, m[2] as string] : [text, ''];
}

/**
 * One front page: the lead story, more stories, boxes. Every story can be put into the dossier
 * by the player (02c §3). The DOM order is the reading order on every width.
 */
export function Issue({ p }: { p: Paper }) {
  const [top, ...more] = p.articles;
  const [lead, rest] = split(top?.text ?? '');
  const hasBook = p.plaques.length > 0 || p.detective_of_day || p.accusations?.length;
  return (
    <div className="front">
      {top && (
        <section className="lead" aria-labelledby="lead-h">
          <h2 id="lead-h" className="headline">
            {top.title}
          </h2>
          <p className="standfirst">{lead}</p>
          {rest && <p className="body">{rest}</p>}
          <FileArticle day={p.day} id={top.id} />
        </section>
      )}

      <div className="briefs">
        {more.map((a) => (
          <section key={a.id} className="brief">
            <h3>{a.title}</h3>
            <p>{a.text}</p>
            <FileArticle day={p.day} id={a.id} />
          </section>
        ))}
        {p.rumors.length > 0 && (
          <section className="brief">
            <h3>Gerüchte</h3>
            {p.rumors.map((g) => (
              <p key={g}>{g}</p>
            ))}
          </section>
        )}
        {p.filler.map((f) => (
          <section key={f} className="brief">
            <h3>Aus dem Haus</h3>
            <p>{f}</p>
          </section>
        ))}
      </div>

      <aside className="side" aria-label="Kästen">
        {p.weather && (
          <section className="box">
            <h3>🌨️ Wetter</h3>
            <p>{p.weather}</p>
          </section>
        )}
        {p.blocked_rooms.length > 0 && (
          <section className="box">
            <h3>⛔ Gesperrt</h3>
            <p>{p.blocked_rooms.join(', ')}</p>
          </section>
        )}
        {p.bonus_rooms.length > 0 && (
          <section className="box">
            <h3>⭐ Heute offen</h3>
            <p>{p.bonus_rooms.join(', ')}</p>
          </section>
        )}
        {p.ads.length > 0 && (
          <section className="box ads">
            <h3>Kleinanzeigen</h3>
            {p.ads.map((g) => (
              <p key={g}>{g}</p>
            ))}
          </section>
        )}
        {hasBook && (
          <section className="box">
            <h3>Gästebuch</h3>
            {p.accusations?.map((name) => (
              <p key={name}>⚖️ {name} hat Anklage erhoben.</p>
            ))}
            {p.detective_of_day && (
              <p>
                🕵️ Ermittler des Tages: <strong>{p.detective_of_day.name}</strong> (
                {p.detective_of_day.points} Punkte)
              </p>
            )}
            {p.plaques.map((x) => (
              <p key={x.title + x.player} className="stamp">
                <span>Erste Entdeckung</span> {x.player}: „{x.title}“
              </p>
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}
