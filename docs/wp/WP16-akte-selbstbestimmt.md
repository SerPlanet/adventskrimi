# WP16 – Akte selbstbestimmt, Zeitstrahl als Tabelle

**Ziel:** Die Akte enthält nur, was der Spieler einlegt. Nichts wird automatisch verbunden. **Lies:** `docs/02c-tagesablauf-v2.md` §3, §6, §7, §8.
**Abhängig von:** WP15.

## Lieferumfang
- **„In die Akte legen“** an Zeitungsartikeln und an einzelnen Gesprächsantworten (Server speichert Einträge je Spieler, Einordnung nach Sprecher/Fundort). Dokumente und Gegenstände im Inventar bleiben wie sie sind.
- **Verlauf** (nachlesbar, unsortiert) als eigener Bereich. **Akte-Reiter:** Personen, Dokumente, Orte, Zeit, Raster nur mit Eingelegtem.
- **Löschen** (im selben WP, keine Altpfade): „Verknüpfen“-Endpunkt und -Knopf, „Das erinnert dich an“, Déjà-vu, Punkte für Verknüpfung (`scoring.json`), automatisches Übertragen in Raster/Zeitstrahl, Notizstufen Auto/Halb.
- **Zeitstrahl-Tabelle:** Zeitfenster oben, Räume links, Zelle antippen → Personen wählen (Mehrfachauswahl). Nur Spielerdaten.
- **Hilfestufe** (Einstellung, Standard aus): erlaubt Widerspruchs-Markierungen im Zeitstrahl. Familie wählbar.
- Tests: Einlegen/Entfernen, Zelle mit mehreren Personen, keine automatischen Einträge, Hilfestufe an/aus. Lighthouse A11y ≥95.

## Nicht tun
Keine neuen Inhalte, keine Dialog-Umbauten (WP17).
