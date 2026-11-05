# WP24 – Zeitung und Rätsel (Code vor dem Freeze, danach Inhalt)

**Ziel:** Jede Zeitung (Tag 1–24) hat dieselbe feste Struktur mit einem Rätsel und einem Witz. Die Kontrollfrage entfällt. Rätsel gibt es auch in den Räumen. **Lies:** `docs/02c` §3, `docs/05`, D77, D86–D89. **Abhängig von:** WP23 Stufe 1.

## 1. Zeitungsstruktur (bindend, Tag 1–24)
Kopf (Datum, Wetter) → Titelstory → weitere Beiträge → Rätsel → Witz des Tages.
- **Titelstory** = Schlagzeile und Text des Tages aus `events.yaml`. **Weitere Beiträge** = `newspaper.yaml` `articles` des Tages, **2 bis 4**. Art (`kind`): `bericht`, `klatsch`, `kurzmeldung`, `anzeige`. Wetter steht im Kopf. Zwei Tage hintereinander haben nicht dieselbe Mischung der Arten.
- **Witz:** `newspaper.yaml` `jokes` (`{day, kind: wortwitz|flachwitz|winter|hotel, text}`), 1–2 Sätze, kein Bezug zu Figuren oder Fall, Art wechselt.
- **Rätsel und Witz tragen nie einen Beleg** (kein `supports`, keine Quelle). Das Rätsel hat nichts mit dem Fall zu tun.
- **Validator `paper`:** je Tag 1 bis `paper_required_through` (`newspaper.yaml`): Titelstory, Beitragszahl 2–4, Witz, Rätsel (aus der Rotation) vorhanden, Mischung ≠ Vortag. Tage danach meldet er als „Inhalt folgt (D80)“ (Hinweis, nicht rot). Der Fall ist nur mit vollständigen Pflichttagen auslieferbar.

## 2. Rätsel-Registry (ein System, `packages/engine/src/puzzles/`)
Das bisherige Tagesrätsel wird erweitert, kein zweites System. Jeder Typ: Erzeugung (deterministisch aus Salz, Tag, Stufe und Falldaten), Prüfung **nur auf dem Server**, Tipp-Leiter (Tipp 1, Tipp 2, Lösung), eine Ansicht ohne Lösung. Punkte: `day.puzzle`, Tipp halbiert nur diese Punkte (`puzzle_hint`), nach dem Kalendertag mal `newspaper_puzzle_late_factor`. Jedes Rätsel ist in ≤3 Minuten lösbar (Invariante 5).

| Typ (`kind`) | Daten im Fall (`riddles.yaml`) | Prüfung | UI | Barrierefreiheit |
|---|---|---|---|---|
| `sudoku` 4×4, 6×6 (9×9 später) | nichts (Generator, eindeutig) | Ziffernfolge | Feld mit Eingabefeldern | Pfeiltasten, Beschriftung „Zeile, Spalte“ |
| `wordle` (5 Buchstaben, deutsch) | `wordle` Liste (nur Lösungswörter, ≥30) | Jede Folge aus 5 Buchstaben ist ein Tipp (D90), der Server liefert Treffer je Buchstabe (Zeichen und Wort, nie nur Farbe) | Raster, Eingabe, 6 Versuche | Rückmeldung als Text |
| `word` (Anagramm) | `anagrams` je Stufe | Text | Buchstaben und Eingabe | Buchstaben als Text |
| `cipher` (Caesar mit Beispiel) | `phrases` | Text | Geheimtext, Beispiel | Text vorlesbar |
| `number` (Zahlenfolge/Rechenkette), `logic` | nichts (Generator) | Text | wie bisher | wie bisher |

Spätere Typen (Liste): Silbenrätsel, Schach-Mattaufgabe (feste Stellungen, Zugeingabe auch als Text „e2 nach e4“), Kreuzworträtsel, Labyrinth, Rebus, Schiebepuzzle.
**Rotation** steht in `riddles.yaml` (`rotation: [Typen]`, Tag n nimmt Eintrag `(n-1) mod Länge`), nie im Code (Invariante 12). Keine neue Dependency.

## 3. Kontrollfrage entfällt
`questions.yaml`, `Question`, `questionOfDay`, `answerQuestion`, `state.questions`, `view.question`, Punkte `question`/`question_hint`, UI und Tests werden gelöscht.

## 4. Räume (Schritt 4, nach Ok)
Jeder Raum hat mindestens ein Objekt-Rätsel (`room_puzzles_min` in `config/quality.json`) zusätzlich zu den Dingen. Validator: jeder Raum hat auf jedem freien Tag ≥ Budget+1 Dinge mit Fund (`rooms_need_budget_plus_one`), Beleg oder nicht.

## 5. Inhalt (Schritt 5, nach Ok)
Witze Tag 1–14, Raum-Rätsel, Zeitung Tag 7–14 an Tag 6 angleichen (Zahl, Arten, Tonlage). Tag 15–24: nur Rotation, Inhalt folgt (D80).
