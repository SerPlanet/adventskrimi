# WP06e – Design-Grundlagen: Skins, Schriften, Desktop-Raster

**Ziel:** Jeder Bereich bekommt einen eigenen Look. Die Seite nutzt breite Bildschirme. Basis für WP06f–h.
**Lies:** `docs/05-ui-und-barrierefreiheit.md` (Abschnitt „Look pro Bereich“), `app/src/ui/style-guide.md`.
**Abhängig von:** WP06d.

## Lieferumfang
- **Skins** als CSS-Klassen/Tokens je Bereich: `skin-paper` (Zeitung), `skin-plan` (Hotelplan), `skin-room` (Raum und Nahansicht, dunkel-warm), `skin-file` (Akte). Theorie und Rangliste bleiben im bisherigen Look. Jeder Skin hat eigene Schrift, Farben, Flächen, Ränder, Knopfformen. Gemeinsam bleiben: Navigation, Fokus-Ringe, Mindestkontrast AA, Touch-Ziele ≥48 px.
- **Schriften** lokal gebündelt (OFL, WOFF2 in `app/public/fonts/`, kein CDN): Serifen-Display für die Zeitung (z. B. Playfair Display), Serifen-Text (z. B. Source Serif 4), Schreibmaschinen-Schrift für die Akte (z. B. Courier Prime). Eintrag im Entscheidungslog (Lizenzen, Dateigrößen).
- **Desktop-Raster:** Inhalt ab 900 px bis ca. 1200 px Breite mittig (`.wrap`), Zwei-Spalten-Layouts als wiederverwendbare Bausteine. Navigation am PC oben oder links, am Handy unten. Handy/Tablet bleiben einspaltig.
- Kurzer Skin-Teil in `app/src/ui/style-guide.md` (Palette und Schriften je Skin).

## Abnahme
- Playwright-Screenshots bei 360, 768 und 1440 px ohne Überlauf auf allen Screens.
- Lighthouse A11y ≥95 und Kontrast AA je Skin.
- Theorie und Rangliste unverändert.

## Nicht tun
Keine Inhalte der Screens umbauen (macht WP06f–h). Keine Änderung der Spiellogik.
