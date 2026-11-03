# WP06b – UI-Redesign: Hotel, Raum, Popups, Zeitung

> **Ersetzt durch WP06e–WP06h** (Skins, Hotelplan wie Cluedo, komponierter Raum, Zeitung im Zeitungslook, Akte als Ordner). Nur noch als Historie lesen.

**Ziel:** Hotel und Aktionen fühlen sich wie ein Spiel an, die Zeitung wie eine Zeitung. Akte, Raster, Zeitstrahl und Rangliste bleiben unverändert.
**Lies:** `docs/05-ui-und-barrierefreiheit.md` (Abschnitt „Redesign“), `docs/02-spielregeln.md` §5 und §7, `docs/04-fall-und-inhalte.md` §5 (Präsentationsfelder).
**Abhängig von:** M2 (WP08, WP09 Teil 2). Ändert keine Spiellogik.

## Lieferumfang
1. **Hotelkarte als Querschnitt:** Räume als Raster nach `floor`/`col` aus `rooms.yaml`. Marker: Personen (Kreise mit Initial), auffällig (gelbes „!“), erreichbar (gestrichelt), „Du“ (gelb), nicht erreichbar (gedimmt). Antippen eines erreichbaren Raums zeigt eine Vorschau, der Wechsel passiert nur beim „Tag beenden“.
2. **Raumszene:** Pro Raum eine Szene (SVG, später austauschbar gegen Bilder aus `app/public/scenes/<room_id>.*`). Hotspots aus `objects[].spot {x,y}` und NPC-Plätze. Jeder Hotspot ist antippbar (≥48 px Fläche) **und** steht zusätzlich in einer Liste „Was gibt es hier?“ (Tastatur, Screenreader).
3. **Popups** (kleine Karten, ≤60 Wörter, schließbar, Fokus-Falle):
   - **Dialog:** Person antippen → Themen als Chips → Antwort als 2–4 Sprechblasen. Ein Thema = eine Quelle.
   - **Notiz/Brief:** Objekt antippen → Karte „Zettel“ mit Absender/Empfänger und Text (z. B. „Hey Clara, ich komme später um 8 auf dein Zimmer.“).
   - **Gegenstand:** Fund in das Inventar mit kurzer Beschreibung.
   - **Atmosphäre:** Ansehen ohne Fund, kostet nie eine Aktion.
4. **Aktionen als drei Kerzen** statt Text (verbrauchte erlöschen, `aria-label` mit Zahl). Inventar als Kästchen-Leiste, „Benutzen“ = Gegenstand antippen, dann Ziel antippen.
5. **Tag beenden („Gute Nacht“):** Karte öffnet sich, du tippst den Raum für morgen.
6. **Zeitung:** Titelkopf mit Ausgabe/Datum, große Schlagzeile (Ereignis), Artikel in Spalten, Kästen für Wetter, Kleinanzeigen, Ermittler des Tages, Plaketten als Stempel, darunter Leserfrage und Rätsel-Ecke. Mobil einspaltig. Blättern zwischen Tagen mit kurzer Animation (aus bei `prefers-reduced-motion`).
7. Hell/dunkel, Schriftgrößen aus `docs/05` bleiben gültig.

## Schema-Ergänzungen (mit WP01-Mitteln, nicht-brechend, alle optional)
- `rooms.yaml`: `floor`, `col`, `scene`; `objects[].spot`.
- `sources.yaml`: `presentation: dialog|note|object|ambient`, `lines` (Dialogzeilen mit `speaker`), `note: {from, to, text}`.
- Validator: Wortgrenze (≤60) gilt für den gesamten Popup-Text einer Quelle.

## Abnahme
- Playwright: Raum öffnen, Person antippen, Thema wählen, Dialog sichtbar, Fund in der Akte. Notiz öffnen, schließen. Karte: Raum für morgen wählen.
- Lighthouse A11y ≥95 auf Zeitung, Hotel, Raum. Alle Hotspots auch per Tastatur und Liste erreichbar.
- Kein Layoutbruch bei 360 px und Schrift „sehr groß“.
- Alle bisherigen Tests bleiben grün.

## Nicht tun
Keine Änderung an Aktionsbudget, Punkten, Engine-Regeln. Keine Fall-Inhalte (die Anpassung der Texte an Dialog/Notiz macht WP10-Nacharbeit).
