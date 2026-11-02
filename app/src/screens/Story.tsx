import { useSession } from '../store';

/** Resolution: the story in chapters, then the result. Only sent by the server when allowed. */
export function Story() {
  const { view } = useSession();
  const s = view?.story;
  if (!view || !s) return null;
  const names = { who: 'Dieb', accomplice: 'Komplize', when: 'Zeit', where: 'Ort' } as const;
  return (
    <section className="card" aria-label="Auflösung">
      <h2>📖 Die Auflösung</h2>
      {s.chapters.map((c, i) => (
        <div key={i}>
          <h3>Kapitel {i + 1}</h3>
          <p>{c}</p>
        </div>
      ))}
      <h3>Dein Ergebnis</h3>
      <ul className="plain">
        {s.solution.map((x) => (
          <li key={x.cat}>
            {x.right ? '✓' : '✗'} {names[x.cat]}: {x.answer}
            {!x.right && x.yours && <span className="small"> (du: {x.yours})</span>}
          </li>
        ))}
        {s.proof.map((q) => (
          <li key={q.id}>
            {q.right ? '✓' : '✗'} {q.text} {q.correct.join(', ')}
          </li>
        ))}
      </ul>
      <p>Deine Punkte findest du in der Rangliste unter „Meine Punkte“.</p>
    </section>
  );
}
