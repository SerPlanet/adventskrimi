# WP05 – Backend

**Ziel:** Edge Functions mit der Engine, sicher und idempotent.
**Lies:** `docs/06-architektur.md` (Sicherheit, API, Tageslogik), `docs/02-spielregeln.md` §7, §12, §13.
**Abhängig von:** WP03

## Lieferumfang
- Edge Functions: `state`, `open_day`, `act`, `end_day`, `answer_daily`, `scoreboard`, `newspaper`, `settings`, `admin_players` (anlegen/ändern). Rätsel, Theorie und Anklage folgen in WP07–WP09.
- Gemeinsame Hilfsfunktionen: Spielwahl, Spielerprüfung, `request_id`-Idempotenz, Zeit mit Override (nur Staging).
- Zeitungsgenerator: Ereignis, Klatsch, Wetter, Anzeigen aus Vorlagen, Gerüchte (≥3 aktive Spieler), Plaketten, „Ermittler des Tages“; einmal pro Tag gespeichert.
- Antworten enthalten nur freigeschaltete Inhalte. Keine Lösung, keine Zukunft.
- Integrationstests gegen Staging mit `_test` und Zeitraffer.

## Abnahme
- Tests: Doppelaufruf derselben `request_id` verändert nichts. Fremder Tag/Raum wird abgelehnt. Leere Aktion verbraucht nichts. Zeitungs-Race (zwei gleichzeitige Aufrufe) erzeugt eine Zeitung.
- Direkter Tabellenzugriff mit `anon`-Key ist verweigert.
- Prod-Funktion bricht ab, wenn `GAME_NOW_OVERRIDE` gesetzt ist.

## Nicht tun
Kein Realtime, kein Cron als Pflicht, keine UI.
