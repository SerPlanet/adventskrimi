# WP06j – Genauer untersuchen (kleines Aktionsbudget) und klarere Raumszene

**Ziel:** Klar erkennbar, was kostenlos ist und was eine Aktion kostet. Nicht alles ist anklickbar, keine „!“-Zeichen.
**Lies:** `docs/02b-erkunden.md` §1, §2, §8, `docs/04-fall-und-inhalte.md` §5b (`klasse`), `docs/05-ui-und-barrierefreiheit.md` (Raum).
**Abhängig von:** WP06f. Läuft vor WP06g.

## Lieferumfang
- **Engine/API:** Aktionsbudget für L1 „Genauer untersuchen“ wiedereinführen (klein, `actions_per_day` im Profil, Prolog-Werte). Kostet nur bei neuem Fund. Alles andere (Ansehen, Gespräche, Zeigen, Lesen) bleibt frei. Das Budget steht in der Ansicht (`actions {used, budget}`). Die in WP06c entfernte Budgetlogik wird als **neues, schmales Modul** gebaut, nicht als altes Stück zurückkopiert.
- **Klassen der Dinge:** `deko`, `ansehen`, `untersuchbar` (siehe `04` §5b). Der Konverter der Kompatibilitätsschicht leitet sie ab: Dinge ohne Quelle = `deko`, Dinge mit nur Beschreibung = `ansehen`, Dinge mit Fund = `untersuchbar`. Der Server verrät dem Client nicht vorab, welche untersuchbaren Dinge heute etwas bringen. Der Knopf „Genauer untersuchen“ erscheint in der Nahansicht nur, wenn es etwas gibt.
- **UI Raum:** Alle „!“-Abzeichen entfernen. Deko ist nicht anklickbar (kein Hover). Anklickbare Dinge werden bei Hover/Fokus hervorgehoben. Ein Knopf **„Umsehen“** lässt alle anklickbaren Dinge kurz aufleuchten (Touch). Nahansicht: Beschreibung frei, bei untersuchbaren Dingen der Knopf **„Genauer untersuchen (kostet 1 Aktion)“**, solange Budget übrig ist. Anzeige **„Aktionen übrig (1/2)“** im Raum, nach Verbrauch aktualisiert. Bei 0 steht „Für heute genug untersucht. Gespräche und Lesen sind weiter frei.“
- **Bots, Validator, Planer** auf das Budget B umstellen (`07`), Grenzen neu kalibrieren.
- **Inhalte:** je Raum und Tag mehr untersuchbare Dinge als Aktionen, dazu freie Funde. Die Anpassung des Falls macht danach ein Sub-Agent (WP10b-Nacharbeit).

## Abnahme
- Tests: Ansehen, Gespräch, Zeigen und Lesen kosten nichts. Untersuchen kostet 1 und nur bei neuem Fund. Bei Budget 0 ist der Knopf deaktiviert mit Hinweis. Das Budget wird je Tag zurückgesetzt. Alte Spielstände laden.
- Playwright: Deko nicht anklickbar, „Umsehen“ hebt Dinge hervor, Nahansicht mit Knopf, Zähler 2/2 → 1/2.
- Keine „!“-Reste (Suche im Code und in Screenshots). Lighthouse A11y ≥95. Alte Wege gelöscht (Entdeckt-x-von-y-Zähler, „!“-Logik).

## Nicht tun
Keine Änderung an Punkten, Zeitung oder Akte. Keine neue Optik außer den genannten Punkten.
