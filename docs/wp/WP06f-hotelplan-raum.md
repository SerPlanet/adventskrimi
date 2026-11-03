# WP06f – Hotelplan wie Cluedo und komponierter Raum

**Ziel:** Ein Grundriss auf einer Ebene, den man versteht, und Räume, die wie Bilder aussehen.
**Lies:** `docs/05-ui-und-barrierefreiheit.md` („Hotelplan“, „Raum“), `docs/04-fall-und-inhalte.md` §5b (Plan-Felder), `docs/02b-erkunden.md` §2.
**Abhängig von:** WP06e.

## Hotelplan (Skin `skin-plan`)
- **Eine Ebene** von oben mit Räumen, **Flur**, sichtbaren **Türen**, Außenbereich (Eingang, Terrasse, Bäume/Schnee). **Keller und Dachboden** erscheinen als Treppen am Rand des Flurs („Treppe Keller“, „Treppe Dachboden“) und sind trotzdem normale Räume im Graphen.
- Daten in `rooms.yaml`: `plan {x,y,w,h}` je Raum (Raster-Einheiten), `doors [{a,b,at}]`, `outside [{kind,x,y,w,h,label}]`, `stairs`. **Die Türen müssen exakt dem Raumgraphen entsprechen** (Validator-Check: jede Kante hat eine Tür, jede Tür eine Kante).
- Markierung: du (gelb, Spielfigur), Personen (Kreise mit Initial), Ausrufezeichen nur bei Entdeckungen heute, gestrichelt = morgen erreichbar (Familie: alle Räume erreichbar, dann ohne Strichelung, mit Hinweis „Du kannst überall hin“). Tippen auf einen Raum zeigt Name und Vorschau; der Wechsel passiert nur bei „Gute Nacht“.
- Desktop: Plan groß, Tagesinfos daneben.

## Raum (Skin `skin-room`)
- **Von Hand komponierte Szene** pro Raum (Wand, Wandfuß, Boden mit Perspektive, Fenster, Licht), Props in realistischer Größe und Lage (Pinnwand an der Wand, Tresor in der Ecke, Zettel auf dem Tisch). **Kein Raster, keine Tabelle.**
- Positionen, Größe und Ebene (vorn/hinten) je Ding aus `rooms.yaml` (`spot {x,y}`, `scale`, `layer`) über den Hotspot-Editor. Der Agent komponiert die Standardlage selbst und prüft mit Screenshots.
- „!“ nur bei Dingen mit Entdeckung an diesem Tag. Beim Antippen: Nahansicht wie in WP06d.
- **Liste der Dinge** nur als eingeklappte Hilfe (Tastatur, Screenreader), nicht im Hauptbild.
- Unten: „Entdeckt x von y“ und Inventar-Leiste.

## Abnahme
- Playwright: Plan zeigt alle Räume, Türen entsprechen dem Graphen, Wechsel nur über „Gute Nacht“, Raum-Szene zeigt Props an ihren Positionen, Liste ist eingeklappt aber per Tastatur erreichbar.
- Screenshots bei 360 und 1440 px der Lobby und des Plans.
- Lighthouse A11y ≥95.

## Nicht tun
Keine Änderung der Erkunden-Regeln oder der Inhalte außer den Plan-/Szenenfeldern.
