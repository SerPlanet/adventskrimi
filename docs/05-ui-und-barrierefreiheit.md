# 05 – UI und Barrierefreiheit

## Zielgeräte
Handy (ab 360 px Breite), Tablet, Desktop. Eine Spalte, kein horizontales Scrollen. Browser: aktuelle Versionen von Chrome, Safari, Firefox, Edge.

## Navigation
Untere Leiste mit 5 Einträgen (große Icons mit Text): **Zeitung · Hotel · Akte · Theorie · Rangliste**. Oben: Spielername (Tippen = Spieler wechseln) und Einstellungen. Der Tag-Status zeigt immer „Aktionen: 2 von 3 übrig“.

## Screens
| Screen | Inhalt |
|---|---|
| Namenswahl | Kacheln mit Name und Avatar. Letzter Spieler auf diesem Gerät ist hervorgehoben. |
| Zeitung | Startscreen jedes Tages. Abschnitte laut `02` §7. Rätsel des Tages als Karte am Ende. |
| Hotel | Karte (Räume antippen), Raumansicht mit Personen und Objekten, Aktionsleiste. Auffälliges mit Ausrufezeichen. |
| Gespräch/Untersuchung | Kartenansicht (Text ≤60 Wörter), Button „In Akte heften“ (nur Notizstufe Manuell/Halb). |
| Akte | Alle Funde, filterbar nach Person, Raum, Tag, Typ (Fakt/Aussage). Suche. Inventar. Hotelbuch als Reiter. |
| Raster | Cluedo-Tabelle: Zeilen = Kandidaten, Spalten = Kategorien Wer/Komplize/Wo/Wann. Zellen: ? / ✗ / ✓. Auto/Halb/Manuell nach Einstellung. |
| Zeitstrahl | Siehe unten. |
| Theorie | Vier Felder (Dropdown/Kacheln), „Speichern“, später Button „Anklage erheben“ mit Bestätigung. |
| Rätsel | Tagesrätsel und Objekt-Rätsel im selben Rahmen: Titel, Spielfläche, Tipp-Knopf, Überspringen. |
| Rangliste | Alle Spieler, eigene Zeile und Nachbarn hervorgehoben, Ränge, Plaketten. |
| Einstellungen | Schrift, Notizstufe, Rätselstufe, Erklärungen, Dunkelmodus, Spieler wechseln. |
| Auflösung | Erscheint nach Abgabe + ab Tag 24; Geschichte in Kapiteln, dann Punkteübersicht. |
| Admin | Siehe WP11. Nur lesen (+ Zeitraffer in Staging). Nicht für Spieler verlinkt. |

## Zeitstrahl (Kernwerkzeug)
- Zeilen = Personen (NPCs), Spalten = Zeitfenster der Tatnacht (Familie 4, Freunde 8). Zusätzlich eine Zeile „Beute/Objekte“.
- Einträge sind Aussage- oder Fakt-Karten aus der eigenen Akte. Platzieren per Tippen (Karte wählen → Feld antippen). Kein Drag-and-Drop nötig, Drag optional.
- Fakt-Einträge haben feste Form, Aussage-Einträge sind gestrichelt.
- **Widersprüche** (nach den eigenen Einträgen): rote Umrandung beider Einträge plus Text „Passt nicht: …“. Antippen zeigt beide Quellen. Siehe Notizstufen in `02` §8.
- Der Zeitstrahl nutzt nie Wissen, das der Spieler nicht in seiner Akte hat.

## Barrierefreiheit (Checkliste pro UI-Änderung)
- [ ] Basisschrift 18 px, Einstellung bis 26 px, bricht Layout nicht.
- [ ] Kontrast WCAG AA (Text ≥4,5:1), Dunkelmodus verfügbar.
- [ ] Touch-Ziele ≥48×48 px, Abstand ≥8 px.
- [ ] Information nie nur durch Farbe (zusätzlich Symbol oder Text).
- [ ] Kein Zeitdruck, keine Auto-Weiterleitung, keine blinkenden Elemente.
- [ ] Alle Bedienelemente per Tastatur erreichbar, sichtbarer Fokus.
- [ ] Semantisches HTML, Labels für Icons, `aria-live` für Ergebnismeldungen.
- [ ] Unumkehrbare Aktionen (Anklage, Tag beenden) mit klarer Bestätigung in einfacher Sprache.
- [ ] Texte in einfacher Sprache (Du-Form, kurze Sätze, keine Anglizismen, wo vermeidbar).
- [ ] Funktioniert ohne Login-Daten, mit blockierten Cookies nur eingeschränkt: Falls Speicherung scheitert, erscheint die Namenswahl neu (kein Absturz).
- [ ] Optional (Could): Vorlesen-Knopf per Browser-Sprachausgabe.

## Gestaltung
Warm-winterlich (Holz, Schnee, Kerzenlicht), ruhige Animationen (≤300 ms, abschaltbar durch `prefers-reduced-motion`). Avatare: einfache Illustrationen/Emojis, vom Admin wählbar. Keine Werbung, keine externen Tracker.

## Fehlerverhalten
Offline/Server-Fehler: freundliche Meldung („Das Hotel ist gerade nicht erreichbar, versuche es gleich noch einmal.“), nichts geht verloren. Aktionen sind idempotent (siehe `06`).

## Look pro Bereich (WP06e–h, ersetzt WP06b)
Jeder Bereich hat einen eigenen **Skin** (Schrift, Farben, Layout). Gemeinsam bleiben Navigation, Fokus, Kontrast AA, Touch-Ziele ≥48 px und die Tastaturbedienung.
| Bereich | Skin | Kern |
|---|---|---|
| Zeitung | `skin-paper` | Echte Titelseite: fetter Titelkopf, Kachel-Artikel, Kästen, eine scrollbare Seite pro Tag, einfache Überblendung zwischen Tagen |
| Hotelplan | `skin-plan` | Ein Grundriss von oben (wie Cluedo): Räume, Flur, Türen, Außenbereich, Treppen zu Keller und Dachboden |
| Raum | `skin-room` | Von Hand komponierte Szene mit Props an realen Orten, kein Raster. **Keine „!“-Zeichen im Bild.** Nur ein Teil der Dinge ist anklickbar (Hervorhebung bei Hover/Fokus, Knopf „Umsehen“ für Touch). Zeile „Aktionen übrig (1/2)“. Liste der Dinge nur eingeklappt als Hilfe |
| Akte | `skin-file` | Aktenordner mit Reitern (Personen, Dokumente, Orte, Zeit), Karteikarten, Verknüpfungen auf der Karte. Keine Tafel mit Schnüren |
| Theorie, Rangliste | bisher | unverändert |
**Popups:** Dialog (Sprechblasen + Chips + Zeigen), Dokument-Leser (Einstecken), Gegenstand. ≤60 Wörter, Fokus-Falle, Esc/Schließen, Fokus kehrt zurück.
**Desktop (ab 900 px):** Inhalt bis ca. 1200 px mittig, Zwei-Spalten-Layouts, Navigation oben oder links. Handy/Tablet einspaltig.
**Zeitung:** Ein Spieler liest nur bis min(heute, eigener Spieltag), serverseitig erzwungen.

## Tagesablauf v2 (WP15–WP19, siehe `02c`)
- Startseite → Erzähltext (lesbar, überspringbar) → Zeitung (3–5 Artikel mit „In die Akte legen“) → Tag-Reiter mit Ort, Personen im Raum, Szene und Statuschip (rot „Tag beendet“, grün „Tag noch nicht abgeschlossen“).
- Kein Bereich „Rätsel im Raum“. Gespräche starten sofort als Dialog mit Fragenliste und „In die Akte legen“ je Antwort.
- Akte zeigt nur, was der Spieler eingelegt hat. Reiter Zeit = Tabelle (Zeitfenster oben, Räume links, Personen pro Zelle wählbar). Raster bleibt.
- Keine Hilfestufe. Alle Spieler lösen selbst.

