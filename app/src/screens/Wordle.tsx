/** Marks from the server: g = right place, y = elsewhere in the word, n = not in the word. */
const WORDS = { g: 'richtig', y: 'falscher Platz', n: 'nicht im Wort' } as const;
const SIGN = { g: '✓', y: '↔', n: '✗' } as const;

export interface WordleGuess {
  word: string;
  marks: string;
}

/**
 * Word game: the guesses with their marks as letters plus a sign plus a word (never colour alone).
 * The player types the next guess in the text field of the frame.
 */
export function WordleBoard({
  guesses,
  tries,
  length,
}: {
  guesses: WordleGuess[];
  tries: number;
  length: number;
}) {
  return (
    <div>
      <ol className="wordle" aria-label="Bisherige Versuche">
        {guesses.map((g, i) => (
          <li
            key={i}
            aria-label={`Versuch ${i + 1}: ${[...g.word]
              .map((l, k) => `${l} ${WORDS[g.marks[k] as keyof typeof WORDS]}`)
              .join(', ')}`}
          >
            {[...g.word].map((l, k) => (
              <span key={k} className={`m-${g.marks[k]}`} aria-hidden="true">
                {l}
                <small>{SIGN[g.marks[k] as keyof typeof SIGN]}</small>
              </span>
            ))}
          </li>
        ))}
      </ol>
      <p className="small">
        ✓ richtig · ↔ falscher Platz · ✗ nicht im Wort. Versuch{' '}
        {Math.min(guesses.length + 1, tries)} von {tries}, {length} Buchstaben.
      </p>
    </div>
  );
}
