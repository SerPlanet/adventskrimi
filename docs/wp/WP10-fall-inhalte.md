# WP10 – Fall-Inhalte „Berghotel“

**Ziel:** Vollständiger, validierter Fall für beide Profile.
**Lies:** `docs/04-fall-und-inhalte.md` (komplett), `docs/07-solver-und-simulator.md` (§2, §5), `docs/02-spielregeln.md` §1, §14.
**Abhängig von:** WP02. Läuft als **Sub-Agent** parallel zu den Code-WPs. Fasst nur `cases/`, `config/profiles/`, `cases/berghotel/insider.yaml` (Vorlage) an.

## Ablauf (in dieser Reihenfolge, nach jedem Schritt `validate-case`)
1. `case.yaml` + `world.yaml`: Lösung und Wahrheit der Tatnacht festlegen (Freunde-Vollversion).
2. NPCs, Räume, Tagespläne, Objekte.
3. Fakten, Aussagen (inkl. Lügen), Widersprüche, Fährten.
4. Quellen mit Redundanz, Plaketten-Titel.
5. Prolog (Tag 1–5) inkl. Stollen-Mini-Fall und Neudeutungen.
6. Ereignisse 1–24, Zeitung (Klatsch, Anzeigen, Gerüchte-Vorlagen), Fragen des Tages, Objekt-Rätsel.
7. Familienprofil: Teilmenge wählen, einzeln validieren.
8. `insider.yaml` als leere Vorlage mit Beispielen für den Menschen.

## Abnahme
- `validate-case cases/berghotel --profile friends` und `--profile family` grün.
- `npm run balance` im Soll (`07` §5), sobald WP04 existiert.
- Keine Lösung in Chat-Ausgaben, Commit-Messages oder Doku.

## Nicht tun
Dateien nie komplett neu erzeugen. Nur beanstandete Stellen patchen. Keine Code-Änderungen außerhalb der genannten Verzeichnisse. Ergebnis an den Haupt-Agent: höchstens 15 Zeilen, ohne Lösungsdetails.
