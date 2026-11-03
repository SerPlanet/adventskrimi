# WP06h – Akte als Ordner mit Karteikarten

**Ziel:** Übersichtliche Akte im Stil einer Tatort-Akte, keine Tafel mit Schnüren.
**Lies:** `docs/05-ui-und-barrierefreiheit.md` („Akte“), `docs/02b-erkunden.md` §3 und §6.
**Abhängig von:** WP06e. Raster, Zeitstrahl und Theorie bleiben unverändert.

## Look (Skin `skin-file`)
- **Aktenordner** (Mappenfarbe) mit **Reitern**: Personen, Dokumente, Orte, Zeit (verweist auf den bestehenden Zeitstrahl). Schreibmaschinenschrift, Papier, Büroklammern, Stempel.
- **Personen:** Karteikarte mit Foto-Polaroid (Avatar/Initial), Name, Rolle, Zähler (Gespräche, Dokumente), darunter **Aussagen** (mit Tag) und **Dokumente** dieser Person. Antippen öffnet die Karte, Aussagen mit Volltext.
- **Dokumente:** Papierstapel, jedes Dokument eine Karte mit Titel, Fundort, Tag. Öffnen zeigt den Volltext (Leser aus WP06d). Einstecken-Status sichtbar.
- **Orte:** je Raum die dort gemachten Funde.
- **„Das erinnert dich an …“:** Verknüpfungen als hervorgehobener Kasten mit Knopf „Verknüpfen“ (+3 Punkte, einmalig) auf der betroffenen Karte, nicht nur oben.
- Suche und Filter nach Person, Raum, Tag, Typ (Aussage/Beobachtung). Dokumente nie automatisch ins Raster/Zeitstrahl (Invariante 13).
- Desktop: links Liste der Karten, rechts Detail.

## Abnahme
- Playwright: Reiter wechseln, Person öffnen, Aussage und Dokument lesen, Verknüpfen. Screenshots bei 360 und 1440 px.
- Lighthouse A11y ≥95, Tastatur komplett bedienbar.

## Nicht tun
Keine Tafel mit Schnüren (bewusst verworfen, unübersichtlich).
