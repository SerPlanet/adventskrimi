# WP06c – Erkunden-Kern (Regeln, Daten, API)

**Ziel:** Das Aktionsbudget wird durch freies Erkunden pro Raum und Tag ersetzt. Dokumente, Zeigen, Verknüpfungen, Déjà-vu.
**Lies:** `docs/02b-erkunden.md` (komplett), `docs/04-fall-und-inhalte.md` §5b, `docs/07-solver-und-simulator.md` §2b/§3.
**Abhängig von:** M2. Hat Vorrang vor WP06d und WP10b-Inhalten.

## Lieferumfang
- **Schemas (nicht-brechend, optional zuerst):** `things`, Ebenen L0/L1/L2, `documents`, Gespräche mit `shows`/`witness_of`, `lies` mit `reason`/`refuted_by`/`confirmed_by`, `links`, `beats`. Migration alter Quellen (`sources.yaml`) auf das neue Modell mit Konverter oder Kompatibilitätsschicht.
- **Engine:** `explore(state, ctx, thing_id, level, ...)`: liefert Funde, ändert den Zustand des Dings, kostet nichts. Fortschritt „x von y entdeckt“ pro Raum/Tag. Entfernt `actions_used`/Budget aus Regeln, API und Ansicht (Rückwärtskompatibel auf Staging-Spielständen via `normalizeState`).
- **Inventar:** Dokumente einstecken und erneut lesen, Gegenstände benutzen, Fund **zeigen** im Dialog.
- **Verknüpfung/Déjà-vu:** Wenn ein Spieler beide Funde eines `links`-Paars hat, erscheint „Das erinnert dich an …“, Bestätigung „Verknüpfen“ gibt +3 Punkte (einmalig). Neue Funde mit Bezug zu alten Einträgen zeigen einen Déjà-vu-Hinweis.
- **Akte:** zeigt Titel/Fundort/Tag, Volltext erst beim Öffnen. Kein automatisches Übertragen von Dokumenten in Raster/Zeitstrahl.
- **Planer und Bots** (WP02/WP04) auf Raumwahl pro Tag umstellen: Bots `optimal`, `greedy`, `random`, `casual` (besucht zufällig, erkundet nur 60 %), `worst`. Grenzen in `config/quality.json` neu kalibrieren.
- **Validator:** Zusatzprüfungen `docs/07` §2b.

## Abnahme
- Tests: kein Budget mehr, alles frei erkundbar, „x von y“ stimmt, Zeigen schaltet Antworten frei, Verknüpfung einmalig +3, Dokument erneut lesbar, Urteils-Textprüfung schlägt bei Verbotsmustern an, Altstände laden weiter.
- `validate-case` und `npm run balance` laufen auf `_test` und (nach WP10b) auf Berghotel.
- Lösung/`truth` weiter nie im Client.

## Nicht tun
Noch keine neuen Grafiken (WP06d), keine Berghotel-Inhalte (WP10b).
