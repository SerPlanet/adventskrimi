# WP06i – Aufräumen vor dem Freeze

**Ziel:** Übergangscode und Altlasten entfernen, damit nur noch ein Weg im Spiel existiert.
**Lies:** `docs/09-offen-und-entscheidungen.md` (D49–D59, besonders D53 Kompatibilitätsschicht), `docs/02b-erkunden.md`.
**Abhängig von:** WP06h. Vor WP12/WP13.

## Lieferumfang
- **Kompatibilitätsschicht** des Erkunden-Kerns (D53) entfernen: altes Quellen-Modell, Fallbacks, alte Feldnamen. Das „Dinge“-Modell ist der einzige Weg. Déjà-vu fertig bauen, falls es nur als Platzhalter existiert.
- **Alte Schema-Felder** streichen (`floor`, `col`, alte Aktionsfelder, nicht mehr genutzte optionale Felder). Staging-Spielstände dürfen zurückgesetzt werden, `normalizeState` nur behalten, wenn ein Prod-Spielstand es braucht (Prod hat keine Spieler).
- **Notbehelf-Layouts** (gleichmäßige Hotspots, Listen-Fallback der Karte) entfernen.
- **Tote Teile finden und löschen:** `knip` (oder `ts-prune`) einrichten und in der CI laufen lassen. Ungenutzte Dateien, Exporte, Abhängigkeiten, CSS-Klassen entfernen (Einträge im Entscheidungslog bei Abhängigkeiten).
- **Doku abgleichen:** Entscheidungen, die sich überholt haben, als „ersetzt“ markieren. `docs/STATUS.md` kurz halten. Keine widersprüchlichen Regeln mehr in `docs/02`–`docs/07`.
- Alle Fall-Dateien neu validieren (`validate-case`, `npm run balance`).

## Abnahme
- `knip` meldet nichts Unbenutztes (oder jede Ausnahme ist begründet).
- Gesamte Test-Suite, Playwright und Lighthouse grün.
- Suche nach `compat`, `legacy`, `fallback`, `deprecated` im Code: nur begründete Treffer.
- Ein Zeitraffer-Durchlauf Tag 1–24 auf Staging ohne Fehler.

## Nicht tun
Keine neuen Funktionen und kein Redesign. Nur Löschen, Vereinfachen, Angleichen.
