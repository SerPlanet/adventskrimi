# Stilregeln für Props und Szenen (WP06d)

Alle Props sind React-SVG in `app/src/ui/props/`. Läuft statisch, keine Bilddateien.

- **Format:** `viewBox="0 0 100 100"`, Ding steht auf einer Grundlinie bei y=94, Blick von vorn.
- **Palette** (Variablen in `shapes.tsx`, nie andere Farben):
  Holz `#8a5a2b`, Holz dunkel `#5e3b1b`, Papier `#f6ecd0`, Metall `#9aa3a8`, Rot `#b8433a`,
  Grün `#3f6b4f`, Gold `#e0b24a`, Schnee `#eef4f8`, Umriss `#3a2616`.
- **Umriss:** 2.5 px (in ViewBox-Einheiten), Linien rund (`strokeLinejoin="round"`).
- **Schattierung:** eine dunklere Fläche an der unteren/rechten Kante (Holz dunkel), kein Verlauf.
- **Zustände:** jedes Prop hat `open=false` (zu, normal) und `open=true` (auf, angehoben, Inhalt sichtbar).
  Der Zustandswechsel ist an einer Fläche sichtbar, nicht nur an einer Farbe.
- **Auffällig:** gelbes „!“-Abzeichen oben rechts am Hotspot (Text bleibt in der Liste), nie blinkend.
- **Overlays:** Zettel, Matsch und Ähnliches sind eigene kleine Formen im Prop (nur bei `open`).
- **Größe in der Szene:** 15 % der Szenenbreite, Hotspot mindestens 48 × 48 px.
- **Szene:** Wand (oben 64 %) mit Wandfeldern und Sockelleiste, Boden (unten 36 %), Farbton je Raum.
- **Barrierefreiheit:** SVG ist `aria-hidden`, der Hotspot ist ein Button mit Namen; die Liste „Was gibt es hier?“ bleibt.
- **Neue Props:** in `shapes.tsx` ergänzen und ein Stichwort in `props/index.tsx` eintragen.
