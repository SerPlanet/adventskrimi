# Agenten-Ablauf pro Work Package

Ergänzt `CLAUDE.md`. Lies diese Datei nur, wenn du unsicher bist, wie ein WP abläuft.

## Ablauf
1. `docs/STATUS.md` lesen → „Nächstes Work Package“.
2. WP-Datei lesen und nur die dort verlinkten Doku-Abschnitte (per Grep auf die Überschrift oder mit offset/limit).
3. Kurzplan (≤8 Zeilen) in `STATUS.md` unter „In Arbeit“ eintragen.
4. Umsetzen. Kleine Schritte, nach jedem Schritt gezielt testen.
5. Definition of Done prüfen (unten).
6. `STATUS.md` aktualisieren (≤5 Zeilen: erledigt, nächstes WP, Blocker).
7. Commit `wpNN: …`. Abschlussbericht ≤10 Zeilen. Stoppen. Nicht eigenmächtig das nächste WP beginnen, außer der Mensch sagt „weiter“.

## Definition of Done (jedes WP)
- Abnahmekriterien der WP-Datei erfüllt.
- `lint` und gezielte Tests grün, vor Abschluss einmal die ganze Suite.
- Keine Spoiler im Client-Bundle (siehe `docs/06`, Abschnitt Sicherheit) und keine Lösung in Doku, Logs, Commits.
- Bei UI: Checkliste aus `docs/05` (Abschnitt Barrierefreiheit) abgehakt.
- Keine neuen Dateien außerhalb der Repo-Karte aus `CLAUDE.md`.
- `STATUS.md` aktuell.

## Sub-Agent einsetzen (max. 1 gleichzeitig)
Erlaubt für Suche, Review, isolierte Fleißarbeit (WP10). Vorlage für den Auftrag:

```
Ziel: <ein Satz>
Dateien: <Pfade, die du bearbeiten darfst>   Nicht anfassen: <Rest>
Lies zuerst: CLAUDE.md (Abschnitte 3 und 4) und <Doku-Datei>
Fertig, wenn: <prüfbares Kriterium, z. B. validate-case grün>
Ergebnis: höchstens 15 Zeilen, nur Fakten und offene Punkte.
```
Das Ergebnis des Sub-Agents prüfst du stichprobenartig (Validator/Tests), nicht durch erneutes Lesen aller Dateien.

## Typische Token-Fallen
- Ganze Doku „zur Orientierung“ lesen.
- Testausgaben und Logs komplett in den Kontext holen.
- Nach jedem Edit die volle Testsuite oder einen Build laufen lassen.
- Eigene Notiz- und Planungsdateien anlegen.
- Fall-Inhalte komplett neu generieren statt gezielt reparieren.
- Dieselbe fehlschlagende Aktion mehr als zweimal wiederholen.
- Screenshots statt DOM-Text zur Prüfung.

## Übergabe bei Kontextende
Alles Wichtige steht in `STATUS.md` und im Code. Schreibe vor einem Abbruch 3–5 Zeilen „Wo ich stehe / was als Nächstes“ in `STATUS.md`. Kein separates Übergabedokument.
