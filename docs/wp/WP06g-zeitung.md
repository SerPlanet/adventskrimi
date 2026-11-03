# WP06g – Zeitung im echten Zeitungslook

**Ziel:** Eine Seite, die wie eine reale Zeitungs-Titelseite aussieht, mit strenger Sperre künftiger Ausgaben.
**Lies:** `docs/05-ui-und-barrierefreiheit.md` („Zeitung“), `docs/02-spielregeln.md` §7.
**Abhängig von:** WP06e.

## Look (Skin `skin-paper`)
- **Eine scrollbare Seite pro Tag**, kein Seitenblättern. Zwischen Tagen genügt eine einfache Überblendung (Pfeile Zurück/Weiter, bei „weniger Bewegung“ ohne Animation).
- Papierfarbe, Serifenschrift, **fetter Titelkopf** („Der Bergbote“) mit Doppellinie, Zeile mit Ausgabe, Datum, Preis.
- **Kachel-Artikel:** große Titelstory (Tagesereignis) mit Überschrift und Vorspann, darunter ein Raster aus kleineren Artikeln. Kästen für Wetter, Kleinanzeigen, Gerüchte, „Ermittler des Tages“, Plaketten als roter Stempel. Rätsel-Ecke und Leserfrage als eigene Kästen am Ende.
- Mobil einspaltig, ab 900 px mehrspaltig mit Titelkopf über die ganze Breite.
- Nach dem Vorbild des Entwurfs (Titelkopf, Schlagzeile, zwei Spalten, Seitenleiste).

## Sperre (serverseitig!)
- Ein Spieler darf nur Ausgaben bis **min(heute, eigener aktueller Spieltag)** lesen. Frühere Tage immer. Die Prüfung gehört in den Endpunkt `newspaper` (aktuell nur `day > heute`), und der „Weiter“-Knopf endet dort.
- Test: Spieler auf Tag 3 bekommt `not_yet` für Tag 4 und höher, auch wenn heute Tag 24 ist.

## Abnahme
- Screenshots bei 360 und 1440 px. Texte ohne Platzhalter, Reihenfolge lesbar (keine Spalten-Sprünge).
- Serverstest für die Sperre. Lighthouse A11y ≥95.

## Nicht tun
Keine Inhaltsänderungen an der Zeitung außer Darstellung (Generator bleibt).
