# WP08 – Raster, Zeitstrahl, Theorie

**Ziel:** Die Denk-Werkzeuge des Detektivs.
**Lies:** `docs/05-ui-und-barrierefreiheit.md` (Raster, Zeitstrahl, Theorie), `docs/02-spielregeln.md` §8, §11.
**Abhängig von:** WP06

## Lieferumfang
- **Raster:** Cluedo-Tabelle (? / ✗ / ✓) mit Notizstufen Auto/Halb/Manuell. Auto: Eliminierungen aus Funden eintragen. Halb: Vorschläge bestätigen. Manuell: nichts automatisch.
- **Zeitstrahl:** Personen × Zeitfenster der Tatnacht, Karten platzieren per Tippen (Drag optional), Aussage gestrichelt, Fakt durchgezogen. Widersprüche nach eigenen Einträgen markieren (Engine). In „Manuell“ der Knopf „Passt das zusammen?“.
- **Theorie-Seite:** vier Felder, speichern, Verlauf serverseitig (`theory.history`).
- **Zeugnisse (Teil):** Anzeige des Inspektor-Satzes nach Tag 10/14/18/22.
- Funktionen `set_theory`, `get_theory`, plus Zeitstrahl-/Rasterzustand serverseitig pro Spieler (damit Geräte wechselbar sind).

## Abnahme
- Test: Zwei widersprüchliche Einträge werden markiert, nicht widersprüchliche nicht. Kein Widerspruch beruht auf Wissen, das nicht in der Akte steht.
- Playwright: Karte aus Akte in Zeitstrahl legen, Widerspruch sichtbar.
- Barrierefreiheit-Checkliste erfüllt (Platzieren per Tippen, Symbole statt nur Farbe).

## Nicht tun
Keine Anklage-Logik (WP09), keine Fall-Inhalte.
