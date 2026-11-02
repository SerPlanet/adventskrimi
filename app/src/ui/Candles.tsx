/** Actions left as candles: spent ones are out. Text alternative carries the numbers. */
export function Candles({ left, budget }: { left: number; budget: number }) {
  const lit = Math.max(0, Math.min(budget, left));
  return (
    <span className="candles" role="img" aria-label={`Aktionen: ${lit} von ${budget} übrig`}>
      {Array.from({ length: budget }, (_, i) => (
        <span key={i} className={i < lit ? 'candle lit' : 'candle out'} aria-hidden="true">
          {i < lit ? '🕯️' : '▫️'}
        </span>
      ))}
    </span>
  );
}
