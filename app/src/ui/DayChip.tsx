/** Day status (02c §9): red when the day is over, green while it can still be played. */
export function DayChip({ over }: { over: boolean }) {
  return (
    <span className={`daychip ${over ? 'over' : 'open'}`} role="status">
      <span aria-hidden="true">●</span> {over ? 'Tag beendet' : 'Tag noch nicht abgeschlossen'}
    </span>
  );
}
