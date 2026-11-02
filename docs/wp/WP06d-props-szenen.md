# WP06d – Props-Bibliothek, Szenen, Nahansichten

**Ziel:** Escape-Room-Look aus einheitlichen Vektorbildern. Alles klickbare ist sichtbar (Wandschrank, Pinnwand mit Zettel, Schuhe).
**Lies:** `docs/02b-erkunden.md` §2/§3/§9, `docs/05-ui-und-barrierefreiheit.md` (Redesign), `docs/wp/WP06b-ui-redesign.md`.
**Abhängig von:** WP06c (Datenformat). Läuft auf GitHub Pages (statisch: SVG/CSS/JS, kein Server nötig).

## Lieferumfang
- **Stilregeln** (`app/src/ui/style-guide.md`, ≤40 Zeilen): Palette (warm, Holz, Schnee, Kerzenlicht), Umrissstärke, Schattierung, Blickwinkel. Alle Props folgen ihr.
- **Props-Bibliothek** (React-SVG-Komponenten in `app/src/ui/props/`): je Prop 2 Zustände (z. B. Schrank zu/auf, Pinnwand normal/angehoben, Schublade zu/auf) und Overlay-Slots (Zettel an der Pinnwand, Matsch an Schuhen). Start mit den ~20 häufigsten Props für die **6 Familien-Räume**, dann Rest.
- **Szenenaufbau:** Raum = Hintergrund (Wand, Boden, Fenster) + Props an `spot`. Auffällig = sichtbare Markierung. Hotspot-Liste „Was gibt es hier?“ bleibt Pflicht.
- **Nahansicht (Modal):** Ding groß mit Zustandswechsel (L1), Dokument-Leser (Zettel, Brief, Foto, mit Einstecken), Dialog mit Sprechblasen, Chips und „Zeigen“-Leiste, Inventar-Leiste.
- **Hotelkarte:** Querschnitt nach `floor`/`col` (kein Fallback mehr nötig).
- **Zeitung:** wie in WP06b.
- **Hotspot-Editor** (nur Entwicklung, `tools/hotspot-editor`): Szene öffnen, Ding anklicken und verschieben, speichert `spot` in `rooms.yaml`.
- Barrierefreiheit: Alles auch per Tastatur und Liste, Fokus-Falle in Popups, Kontraste AA.

## Abnahme
- Playwright: Raum öffnen, Pinnwand ansehen, Tafel anheben, Zettel einstecken, im Inventar erneut lesen. Schuhe zeigen, Verknüpfung bestätigen.
- Lighthouse A11y ≥95 (Zeitung, Hotel, Raumszene, Nahansicht), 360 px ohne Überlauf.
- Reihenfolge der Räume: Familien-Räume zuerst.

## Nicht tun
Keine Spiellogik. Keine Bilddateien von außen ohne Eintrag im Entscheidungslog.
