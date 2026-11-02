# WP02 – Solver und Validator

**Ziel:** Beweisbare Lösbarkeit und Tempo eines Falls.
**Lies:** `docs/07-solver-und-simulator.md` (§1–§3), `docs/04-fall-und-inhalte.md` (§4–§7).
**Abhängig von:** WP01

## Lieferumfang
- `packages/engine/src/solver/`: Kandidatenraum, Fakt-Auswertung für alle Typen aus `04` §4, Konsistenzprüfung, Kandidaten-Restmenge.
- Planer für das Tempo: frühester Tag für einen perfekten Einzelspieler (DP/BFS). Die Aktionslogik nutzt später WP03. Hier genügt eine schlanke interne Variante, die später durch die Engine ersetzt wird, ohne die Schnittstelle zu ändern.
- `tools/validate-case <pfad> --profile <p> [--only <check>]`: Prüfungen 1–10 laut `07` §2, Ausgabe je Prüfung eine Zeile + ≤10 Fehlerzeilen, Exit-Code ≠0 bei Fehler.
- Tests mit `_test` und mit absichtlich kaputten Mini-Fällen (mehrdeutig, unerreichbar, nicht widerlegbare Lüge).

## Abnahme
- `_test` besteht alle Prüfungen.
- Jeder kaputte Mini-Fall wird mit der erwarteten Prüfung abgelehnt.
- Berechnung des Freunde-Kandidatenraums ≤2 s.

## Nicht tun
Keine Fall-Inhalte für Berghotel (WP10). Keine UI.
