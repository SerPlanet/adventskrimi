# WP03 – Engine-Kern

**Ziel:** Alle Spielregeln als reine, testbare Funktionen.
**Lies:** `docs/02-spielregeln.md` (§3–§6, §11–§12), `docs/03-punkte-und-wettbewerb.md`.
**Abhängig von:** WP01

## Lieferumfang (`packages/engine/src/game/`)
- Zustandsmodell: Spieler, Tag, Raum, Aktionen, Funde, Inventar, Theorie.
- `resolveAction(state, caseData, profile, action)`: Verfügbarkeit (Tagesplan, Raum, Ereignis, `requires`), neue Funde, **Aktion nur bei neuem Fund verbrauchen**, Atmosphäre-Meldung bei leer/bekannt.
- Bewegung (`endDay`): frei oder Nachbarräume laut Profil, Raumsperren aus Ereignissen.
- Tageslogik: `dayOf(now, startDate)`, Gnadenfrist bis 3:00, Reihenfolge der Tage.
- Punkte: Ledger-Einträge für alle Quellen aus `03`, Idempotenz über `kind+ref`, Tipp-Halbierung, Rangberechnung, Frühanklage-Formel, Zeugnis-Auswertung.
- Widerspruchserkennung auf Basis der eigenen Zeitstrahleinträge.
- Reine Funktionen ohne I/O, Zeit wird als Parameter übergeben.

## Abnahme
- Vitest-Tests für: leere Aktion verbraucht nichts, doppelte Aktion kostet nichts, Budgetgrenze, Raumsperre, Nachholreihenfolge, Gnadenfrist, jede Punkteregel inkl. Tipp und Idempotenz, Wochenzeugnis, Frühanklage.
- Ein Durchlauf von Tag 1–24 auf `_test` per Skript.

## Nicht tun
Keine Datenbankzugriffe, keine UI, keine Zufalls-Rätselgeneratoren (WP07).
