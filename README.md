# Adventskrimi „Berghotel“

Ein Advents-Krimispiel im Browser: 24 Tage, 24 Türchen, ein Diebstahl in einem eingeschneiten Berghotel. Jeder Spieler ermittelt für sich, es gibt eine Rangliste, und am 24.12. reicht jeder seine Anklage ein. Läuft für eine Freundesgruppe und für die Familie (10–80 Jahre) mit denselben Regeln und einem Fall in zwei Größen.

## So startest du einen Agenten
Starte Claude Code im Projektordner und schreibe:

> Lies `CLAUDE.md` und `docs/STATUS.md` und arbeite das nächste Work Package ab.

Der Agent liest nur die drei Dateien, die er braucht (siehe `CLAUDE.md`). Es arbeitet immer nur ein Haupt-Agent mit höchstens einem Sub-Agent.

## Ordner
| Pfad | Inhalt |
|------|--------|
| `CLAUDE.md` | Arbeitsregeln für Agenten (kurz) |
| `docs/00-index.md` | Landkarte der Doku |
| `docs/STATUS.md` | Aktueller Stand, nächstes Work Package |
| `docs/wp/` | Work Packages WP00–WP14 |
| `docs/agent/` | Detail-Ablauf für Agenten |
| `cases/berghotel/` | **Enthält die Lösung. Als Beobachter besser nicht öffnen.** |

## Hinweise für dich als Mensch
- Du bist Beobachter und spielst nicht mit. Die Doku enthält absichtlich keine Lösung.
- Aufgaben nur für dich (Accounts, Keys) stehen in `docs/STATUS.md` unter „Mensch“.
- Offene Entscheidungen: `docs/09-offen-und-entscheidungen.md`.
