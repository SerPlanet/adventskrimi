# WP07 – Rätsel

**Ziel:** Rätsel des Tages und Objekt-Rätsel.
**Lies:** `docs/02-spielregeln.md` §9–§10, `docs/04-fall-und-inhalte.md` §5 (Quellen mit `requires`).
**Abhängig von:** WP06 (Teil 1 Rätsel des Tages), WP05

## Lieferumfang
- **Rätsel des Tages:** deterministischer Generator pro Tag/Level (Seed = Spieler-unabhängig, Level pro Spieler): Sudoku (4×4, 6×6, 9×9), Worträtsel (Anagramm/Wort finden), Zahlenrätsel (Rechenkette/Gleichung), Logeleien. Optional (Could): Schach-Matt aus CC0-Datenbank (nur Freunde).
- Serverseitige Prüfung der Lösung, Tipp-Leiter (Tipp 1, Tipp 2, Lösung zeigen), Überspringen, Punkte laut `03` (Tipp halbiert, nie negativ).
- **Objekt-Rätsel-Komponenten:** Zahlenschloss, Chiffre (Caesar/Symbole), Buchstaben sammeln und Wort bilden, Auswahl-Rätsel (zwei Aussagen, welche stimmt). Datengetrieben aus `puzzles.yaml`, Lösung nur serverseitig.
- Benutzen-Aktion öffnet das Schloss, Rätsel ≤3 Min.
- UI gemäß `05` (gleicher Rahmen für beide Typen).

## Abnahme
- Generator liefert pro Tag/Level lösbare Rätsel (Test: 24 Tage × 3 Level, Eindeutigkeit bei Sudoku geprüft).
- Fehlversuche kosten nichts, Tipps halbieren Punkte, Überspringen ist jederzeit möglich.
- Playwright-Smoke für ein Tagesrätsel und ein Objekt-Rätsel.

## Nicht tun
Rätsel haben keinen Einfluss auf den Fall außer als Schloss. Keine Fall-Inhalte.
